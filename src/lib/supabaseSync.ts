import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables (standard Vite env setup)
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

// Initialize only if keys are present
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
  console.log('[SUPABASE] Pending configuration. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable cloud persistence.');
}

export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null;
}

/**
 * Syncs a local state collection to Supabase cloud.
 * Upserts a row into the 'opticalize_sync' table.
 */
export async function syncCollectionToSupabase(key: string, data: any): Promise<boolean> {
  if (!supabaseClient) return false;

  try {
    // We filter the data to make sure we don't save garbage
    const cleanData = typeof data === 'string' ? JSON.parse(data) : data;

    const { error } = await supabaseClient
      .from('opticalize_sync')
      .upsert({
        collection_name: key,
        data: cleanData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'collection_name'
      });

    if (error) {
      console.error(`[SUPABASE SYNC] Error syncing collection ${key}:`, error);
      return false;
    }

    console.log(`[SUPABASE SYNC] Successfully synced "${key}" to Supabase.`);
    return true;
  } catch (err) {
    console.error(`[SUPABASE SYNC] Exception during sync for "${key}":`, err);
    return false;
  }
}

/**
 * Loads a synchronized collection from Supabase.
 */
export async function loadCollectionFromSupabase(key: string): Promise<any | null> {
  if (!supabaseClient) return null;

  try {
    const { data, error } = await supabaseClient
      .from('opticalize_sync')
      .select('data')
      .eq('collection_name', key)
      .maybeSingle();

    if (error) {
      console.error(`[SUPABASE LOAD] Error loading collection ${key}:`, error);
      return null;
    }

    if (data && data.data) {
      console.log(`[SUPABASE LOAD] Retrieved "${key}" from Supabase.`);
      return data.data;
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
  if (!supabaseClient) return false;

  console.log('[SUPABASE PULL] Fetching latest database state from cloud...');
  try {
    const { data, error } = await supabaseClient
      .from('opticalize_sync')
      .select('collection_name, data');

    if (error) {
      console.error('[SUPABASE PULL] Failed to pull synced states:', error);
      return false;
    }

    if (data && data.length > 0) {
      let updatedAny = false;
      data.forEach((row: any) => {
        if (SYNCABLE_KEYS.includes(row.collection_name)) {
          const stringified = typeof row.data === 'string' ? row.data : JSON.stringify(row.data);
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
  if (!supabaseClient) return false;

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
