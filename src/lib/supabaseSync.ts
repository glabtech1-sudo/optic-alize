import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Support both Node.js (process.env) and Vite (import.meta.env) with robust fallback defaults
const envUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL)
  ? process.env.SUPABASE_URL
  : ((typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env.VITE_SUPABASE_URL)
      ? (import.meta as any).env.VITE_SUPABASE_URL
      : 'https://vgcarfflqjfbrevfnlyd.supabase.co');

const envAnonKey = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY)
  ? process.env.SUPABASE_ANON_KEY
  : ((typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env.VITE_SUPABASE_ANON_KEY)
      ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY
      : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnY2FyZmZscWpmYnJldmZubHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzU3MjIsImV4cCI6MjA5ODQxMTcyMn0.zc2yUKz7_6h-6_Mxw9MmMTatZ1lb1PwUvjGiai8Q2DU');

export let supabaseClient: SupabaseClient | null = null;
export let isSyncTableAvailable = true;
export let hasWarnedSyncTableMissing = false;

if (envUrl && envAnonKey) {
  try {
    supabaseClient = createClient(envUrl, envAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    console.log('[SUPABASE] Client successfully initialized.');
  } catch (err) {
    console.error('[SUPABASE] Failed to initialize client:', err);
  }
} else {
  console.log('[SUPABASE] Pending configuration.');
}

export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null;
}

/**
 * Unpacks the data stored in Supabase's JSONB column.
 * Supporting both the wrapped object format { value: ... } and direct values for backward compatibility.
 */
export function unpackData(dbData: any): any {
  if (dbData && typeof dbData === 'object' && dbData !== null && 'value' in dbData) {
    return dbData.value;
  }
  return dbData;
}

/**
 * Syncs a local state collection to Supabase cloud.
 * Upserts a row into the 'opticalize_sync' table.
 */
export async function syncCollectionToSupabase(key: string, data: any): Promise<boolean> {
  if (!supabaseClient || !isSyncTableAvailable) return false;

  try {
    // Safely parse JSON strings, otherwise treat as raw text
    let cleanData = data;
    if (typeof data === 'string') {
      try {
        cleanData = JSON.parse(data);
      } catch (e) {
        // Not valid JSON, keep as raw string (e.g. base64 images or names)
        cleanData = data;
      }
    }

    const { error } = await supabaseClient
      .from('opticalize_sync')
      .upsert({
        collection_name: key,
        data: { value: cleanData },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'collection_name'
      });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        isSyncTableAvailable = false;
        if (!hasWarnedSyncTableMissing) {
          hasWarnedSyncTableMissing = true;
          console.warn('[SUPABASE SYNC] Table "opticalize_sync" does not exist yet. Real-time fallback sync smoothly uses local storage. To activate real-time database sync, please run the supabase_migration.sql script.');
        }
      } else {
        console.error(`[SUPABASE SYNC] Error syncing collection ${key}:`, JSON.stringify(error) || error);
      }
      return false;
    }

    console.log(`[SUPABASE SYNC] Successfully synced "${key}" to Supabase.`);
    return true;
  } catch (err: any) {
    console.error(`[SUPABASE SYNC] Exception during sync for "${key}":`, err?.message || err);
    return false;
  }
}

/**
 * Loads a synchronized collection from Supabase.
 */
export async function loadCollectionFromSupabase(key: string): Promise<any | null> {
  if (!supabaseClient || !isSyncTableAvailable) return null;

  try {
    const { data, error } = await supabaseClient
      .from('opticalize_sync')
      .select('data')
      .eq('collection_name', key)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        isSyncTableAvailable = false;
        if (!hasWarnedSyncTableMissing) {
          hasWarnedSyncTableMissing = true;
          console.warn('[SUPABASE LOAD] Table "opticalize_sync" does not exist yet. Using local storage instead.');
        }
      } else {
        console.error(`[SUPABASE LOAD] Error loading collection ${key}:`, error);
      }
      return null;
    }

    if (data && data.data) {
      console.log(`[SUPABASE LOAD] Retrieved "${key}" from Supabase.`);
      return unpackData(data.data);
    }

    return null;
  } catch (err) {
    console.error(`[SUPABASE LOAD] Exception during loading for "${key}":`, err);
    return null;
  }
}

export const SYNCABLE_KEYS = [
  'optic_users',
  'optic_hr_employees',
  'optic_attendance_ledger',
  'optic_leaves',
  'optic_adjustments',
  'optic_payslips',
  'optic_invoices',
  'optic_customers',
  'optic_products',
  'optic_suppliers',
  'optic_inventory',
  'optic_audit_logs',
  'optic_hq_branches',
  'optic_boutiques',
  'optic_app_logo_base64',
  'optic_app_logo',
  'optic_boutique_name'
];

/**
 * Initializes automatic synchronization of local storage changes to Supabase.
 * Monkey-patches localStorage.setItem to auto-upload changes in real-time.
 */
export function initializeAutomaticSupabaseSync() {
  if (!supabaseClient) {
    console.log('[SUPABASE AUTO-SYNC] Skipped. Credentials missing.');
    return;
  }

  // Intercept setItem
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key: string, value: string) {
    originalSetItem.apply(this, [key, value]);

    if (SYNCABLE_KEYS.includes(key)) {
      // Run sync asynchronously in the background
      syncCollectionToSupabase(key, value).catch(err => {
        console.warn(`[SUPABASE AUTO-SYNC] Failed to sync ${key}:`, err);
      });
    }
  };

  console.log('[SUPABASE AUTO-SYNC] Real-time browser local storage synchronizer initialized successfully.');
}

/**
 * Fetches all synced collections from Supabase and populates localStorage on startup.
 */
export async function pullAllCollectionsFromSupabase(): Promise<boolean> {
  if (!supabaseClient || !isSyncTableAvailable) return false;

  console.log('[SUPABASE PULL] Fetching latest database state from cloud...');
  try {
    const { data, error } = await supabaseClient
      .from('opticalize_sync')
      .select('collection_name, data');

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        isSyncTableAvailable = false;
        if (!hasWarnedSyncTableMissing) {
          hasWarnedSyncTableMissing = true;
          console.warn('[SUPABASE PULL] Table "opticalize_sync" does not exist in your Supabase database. Real-time fallback sync smoothly uses local storage. To activate, execute public.opticalize_sync table migration.');
        }
      } else {
        console.error('[SUPABASE PULL] Failed to pull synced states:', JSON.stringify(error) || error);
      }
      return false;
    }

    if (data && data.length > 0) {
      let updatedAny = false;
      data.forEach((row: any) => {
        if (SYNCABLE_KEYS.includes(row.collection_name)) {
          const unpacked = unpackData(row.data);
          const stringified = typeof unpacked === 'string' ? unpacked : JSON.stringify(unpacked);
          const currentVal = localStorage.getItem(row.collection_name);
          if (currentVal !== stringified) {
            localStorage.setItem(row.collection_name, stringified);
            updatedAny = true;
          }
        }
      });

      if (updatedAny) {
        console.log('[SUPABASE PULL] Local state updated from cloud. Triggering component refreshes.');
        window.dispatchEvent(new Event('storage'));
      }
      return true;
    }

    console.log('[SUPABASE PULL] Cloud database is empty or no compatible tables found.');
    return false;
  } catch (err) {
    console.error('[SUPABASE PULL] Exception during full database pull:', err);
    return false;
  }
}

/**
 * Pushes all currently stored local storage collections to Supabase to seed the cloud.
 */
export async function pushAllCollectionsToSupabase(): Promise<boolean> {
  if (!supabaseClient || !isSyncTableAvailable) return false;

  console.log('[SUPABASE PUSH] Seeding local database state to cloud...');
  let successCount = 0;
  for (const key of SYNCABLE_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      const ok = await syncCollectionToSupabase(key, value);
      if (ok) successCount++;
    }
  }
  console.log(`[SUPABASE PUSH] Uploaded ${successCount}/${SYNCABLE_KEYS.length} collections.`);
  return successCount > 0;
}

/**
 * Helper to setup SQL schema in Supabase.
 * Returns the SQL instructions.
 */
export function getSupabaseSetupSQL(): string {
  return `
-- SQL Schema to enable real-time cloud synchronization for Optic Alizé
CREATE TABLE IF NOT EXISTS public.opticalize_sync (
    collection_name text NOT NULL PRIMARY KEY,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.opticalize_sync ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access for read & write
-- Note: Customize this policy based on your production security requirements
CREATE POLICY "Allow public full access" ON public.opticalize_sync
    FOR ALL
    USING (true)
    WITH CHECK (true);
  `;
}
