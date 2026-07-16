import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  mapCustomerToSupabase,
  mapProductToSupabase,
  mapOrderToSupabase,
  mapAuditLogToSupabase,
  mapAppointmentToSupabase,
  mapSightExamToSupabase,
  mapPrescriptionToSupabase,
  mapCompanyToSupabase,
  mapBranchToSupabase,
  mapUserToSupabase
} from '../utils/supabaseMappers';

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
export const missingTables: Record<string, boolean> = {};

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

const memoryStore: Record<string, string> = {};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (isBusinessKey(key)) {
        return globalMemoryStore[key] !== undefined ? globalMemoryStore[key] : null;
      }
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {}
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (isBusinessKey(key)) {
        globalMemoryStore[key] = value;
        syncCollectionToSupabase(key, value).catch(() => {});
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch (e) {}
    memoryStore[key] = String(value);
  },
  removeItem: (key: string): void => {
    try {
      if (isBusinessKey(key)) {
        delete globalMemoryStore[key];
        syncCollectionToSupabase(key, '[]').catch(() => {});
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    } catch (e) {}
    delete memoryStore[key];
  },
  key: (index: number): string | null => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.key(index);
      }
    } catch (e) {}
    const keys = Object.keys(memoryStore);
    return keys[index] || null;
  },
  getLength: (): number => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.length;
      }
    } catch (e) {}
    return Object.keys(memoryStore).length;
  }
};

export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null;
}

/**
 * Unpacks the data stored in Supabase's JSONB column.
 */
export function unpackData(dbData: any): any {
  if (dbData && typeof dbData === 'object' && dbData !== null && 'value' in dbData) {
    return dbData.value;
  }
  return dbData;
}

// -------------------------------------------------------------
// IN-MEMORY METIER STORAGE & REAL-TIME RECONCILIATION ENGINE
// -------------------------------------------------------------

export const globalMemoryStore: Record<string, string> = {};

export interface SyncState {
  loading: boolean;
  status: 'idle' | 'loading' | 'synced' | 'saving' | 'error';
  error: string | null;
  lastSyncedAt: string | null;
}

export let globalSyncState: SyncState = {
  loading: true,
  status: 'loading',
  error: null,
  lastSyncedAt: null
};

const syncStateCallbacks = new Set<(state: SyncState) => void>();

export function subscribeToSyncState(callback: (state: SyncState) => void) {
  syncStateCallbacks.add(callback);
  callback(globalSyncState);
  return () => {
    syncStateCallbacks.delete(callback);
  };
}

export function updateSyncState(newState: Partial<SyncState>) {
  globalSyncState = { ...globalSyncState, ...newState };
  // Defer execution of callbacks to prevent React "Cannot update during render" errors
  setTimeout(() => {
    syncStateCallbacks.forEach(cb => cb(globalSyncState));
  }, 0);
}

/**
 * Detector for business/operational keys that must never live in browser storage.
 */
export function isBusinessKey(key: string): boolean {
  if (!key.startsWith('optic_') && !key.startsWith('pending_optic_')) return false;
  const excludedKeys = [
    'optic_access_token',
    'optic_refresh_token',
    'optic_user_profile',
    'optic_app_language',
    'optic_theme_accent',
    'optic_boutique_name',
    'optic_active_presence_boutique',
    'optic_company_email',
    'optic_company_phone',
    'optic_is_authenticated',
    'optic_user_email',
    'optic_system_factory_reset'
  ];
  return !excludedKeys.includes(key);
}

// Global collections list to synchronize
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
  'optic_boutique_name',
  'optic_crm_customers',
  'optic_fused_catalog',
  'optic_saas_orders',
  'optic_my_clinic_appointments',
  'optic_my_clinic_exams',
  'optic_my_prescriptions',
  'optic_hq_companies',
  'optic_accounting_revenues',
  'optic_accounting_expenses',
  'optic_accounting_sessions',
  'optic_accounting_momo',
  'optic_stock_items',
  'optic_stock_history',
  'optic_sav_claims',
  'optic_push_logs',
  'optic_accounting_boutique_balances',
  'optic_pos_products',
  'optic_credited_loyalty_orders',
  'optic_my_commandes',
  'optic_vouchers_list',
  'optic_backups_list',
  'optic_hq_zones',
  'optic_hq_pending_orders',
  'optic_hq_branch_modules',
  'pending_optic_pos_order'
];

export const MAPPED_KEYS: Record<string, string> = {
  'optic_users': 'users_profiles',
  'optic_hr_employees': 'employees',
  'optic_attendance_ledger': 'attendance',
  'optic_leaves': 'leaves',
  'optic_adjustments': 'adjustments',
  'optic_payslips': 'payslips',
  'optic_crm_customers': 'crm_customers',
  'optic_fused_catalog': 'fused_catalog',
  'optic_saas_orders': 'saas_orders',
  'optic_audit_logs': 'audit_logs',
  'optic_my_clinic_appointments': 'my_clinic_appointments',
  'optic_my_clinic_exams': 'my_clinic_exams',
  'optic_my_prescriptions': 'my_prescriptions',
  'optic_hq_companies': 'hq_companies',
  'optic_hq_branches': 'hq_branches',
  'optic_invoices': 'invoices',
  'optic_customers': 'customers',
  'optic_products': 'products',
  'optic_suppliers': 'suppliers',
  'optic_inventory': 'inventory',
  'optic_accounting_revenues': 'accounting_revenues',
  'optic_accounting_expenses': 'accounting_expenses',
  'optic_accounting_momo': 'accounting_mobile_money',
  'optic_stock_items': 'stock_items',
  'optic_stock_history': 'stock_history',
  'optic_sav_claims': 'sav_claims',
  'optic_push_logs': 'push_logs',
  'optic_my_commandes': 'my_commandes',
  'optic_vouchers_list': 'vouchers_list',
  'optic_backups_list': 'backups_list',
  'optic_hq_zones': 'zones',
  'optic_hq_pending_orders': 'hq_pending_orders',
  'optic_hq_branch_modules': 'hq_branch_modules'
};

// Override Storage Prototype globally to trap business data operations with bulletproof exception protection
if (typeof window !== 'undefined') {
  try {
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.getItem = function (key: string): string | null {
      try {
        if (isBusinessKey(key)) {
          return globalMemoryStore[key] !== undefined ? globalMemoryStore[key] : null;
        }
        return originalGetItem.apply(this, [key]);
      } catch (e) {
        console.warn(`[SECURITY] Storage.prototype.getItem blocked for key "${key}". Falling back to memory.`, e);
        return globalMemoryStore[key] !== undefined ? globalMemoryStore[key] : null;
      }
    };

    Storage.prototype.setItem = function (key: string, value: string) {
      try {
        if (isBusinessKey(key)) {
          globalMemoryStore[key] = value;
          updateSyncState({ status: 'saving' });
          
          syncCollectionToSupabase(key, value)
            .then(success => {
              if (success) {
                updateSyncState({
                  status: 'synced',
                  error: null,
                  lastSyncedAt: new Date().toLocaleTimeString()
                });
              } else {
                updateSyncState({
                  status: 'error',
                  error: `Échec d'enregistrement pour : ${key}`
                });
              }
            })
            .catch(err => {
              updateSyncState({
                status: 'error',
                error: err.message || `Erreur de connexion lors de la sauvegarde de ${key}`
              });
            });

          window.dispatchEvent(new Event('storage'));
          return;
        }
        originalSetItem.apply(this, [key, value]);
      } catch (e) {
        console.warn(`[SECURITY] Storage.prototype.setItem blocked for key "${key}". Falling back to memory.`, e);
        globalMemoryStore[key] = value;
      }
    };

    Storage.prototype.removeItem = function (key: string) {
      try {
        if (isBusinessKey(key)) {
          delete globalMemoryStore[key];
          updateSyncState({ status: 'saving' });
          syncCollectionToSupabase(key, '[]')
            .then(() => {
              updateSyncState({
                status: 'synced',
                error: null,
                lastSyncedAt: new Date().toLocaleTimeString()
              });
            })
            .catch(() => {});
          window.dispatchEvent(new Event('storage'));
          return;
        }
        originalRemoveItem.apply(this, [key]);
      } catch (e) {
        console.warn(`[SECURITY] Storage.prototype.removeItem blocked for key "${key}". Falling back to memory.`, e);
        delete globalMemoryStore[key];
      }
    };
  } catch (err) {
    console.error('[SECURITY] Critical: Failed to override Storage.prototype properties.', err);
  }
}

/**
 * Syncs a collection directly to Supabase cloud.
 */
export async function syncCollectionToSupabase(key: string, data: any): Promise<boolean> {
  if (!supabaseClient) return false;

  try {
    let cleanData = data;
    if (typeof data === 'string') {
      try {
        cleanData = JSON.parse(data);
      } catch (e) {
        cleanData = data;
      }
    }

    const tableName = MAPPED_KEYS[key];
    const boutiqueName = safeLocalStorage.getItem('optic_boutique_name') || 'Global';
    let syncSuccess = false;

    if (tableName && !missingTables[tableName]) {
      try {
        const items = Array.isArray(cleanData) ? cleanData : [cleanData];
        let hasError = false;

        for (const item of items) {
          if (!item || typeof item !== 'object') continue;
          const itemId = item.id || item.email || `gen-${Math.floor(Math.random() * 1000000)}`;
          
          // Apply schema mappers based on the key / module
          let mappedItem = item;
          if (key === 'optic_crm_customers') {
            const mapped = mapCustomerToSupabase(item, boutiqueName);
            mappedItem = mapped?.data?.value || item;
          } else if (key === 'optic_fused_catalog') {
            const mapped = mapProductToSupabase(item, boutiqueName);
            mappedItem = mapped?.data?.value || item;
          } else if (key === 'optic_saas_orders') {
            const mapped = mapOrderToSupabase(item, boutiqueName);
            mappedItem = mapped?.data?.value || item;
          } else if (key === 'optic_audit_logs') {
            const mapped = mapAuditLogToSupabase(item, boutiqueName);
            mappedItem = mapped?.data?.value || item;
          } else if (key === 'optic_my_clinic_appointments') {
            const mapped = mapAppointmentToSupabase(item, boutiqueName);
            mappedItem = mapped?.data?.value || item;
          } else if (key === 'optic_my_clinic_exams') {
            const mapped = mapSightExamToSupabase(item, boutiqueName);
            mappedItem = mapped?.data?.value || item;
          } else if (key === 'optic_my_prescriptions') {
            const mapped = mapPrescriptionToSupabase(item, boutiqueName);
            mappedItem = mapped?.data?.value || item;
          } else if (key === 'optic_hq_companies') {
            const mapped = mapCompanyToSupabase(item, boutiqueName);
            mappedItem = mapped?.data?.value || item;
          } else if (key === 'optic_hq_branches') {
            const mapped = mapBranchToSupabase(item, boutiqueName);
            mappedItem = mapped?.data?.value || item;
          }

          let safeMappedItem = mappedItem;
          try {
            safeMappedItem = JSON.parse(JSON.stringify(mappedItem));
          } catch (e) {
            console.warn('[SUPABASE SYNC] JSON sanitization failed for table sync:', e);
          }

          const payload = {
            id: String(itemId),
            boutique_name: boutiqueName,
            data: { value: safeMappedItem },
            updated_at: new Date().toISOString()
          };

          const { error: upsertErr } = await supabaseClient
            .from(tableName)
            .upsert(payload, { onConflict: 'id' });

          if (upsertErr) {
            console.warn(`[SUPABASE SYNC WARNING] Table ${tableName} upsert failed:`, upsertErr);
            if (upsertErr.code === '42P01' || upsertErr.message?.includes('does not exist')) {
              missingTables[tableName] = true;
            }
            hasError = true;
            break;
          }
        }
        if (!hasError) {
          syncSuccess = true;
        }
      } catch (tableNameErr) {
        console.warn(`[SUPABASE SYNC] Table ${tableName} not accessible, falling back.`, tableNameErr);
        missingTables[tableName] = true;
      }
    }

    // Fallback to central opticalize_sync table
    if (!syncSuccess && isSyncTableAvailable) {
      const mappedCleanData = Array.isArray(cleanData) ? cleanData.map((item: any) => {
        if (!item || typeof item !== 'object') return item;
        if (key === 'optic_crm_customers') {
          return mapCustomerToSupabase(item, boutiqueName)?.data?.value || item;
        } else if (key === 'optic_fused_catalog') {
          return mapProductToSupabase(item, boutiqueName)?.data?.value || item;
        } else if (key === 'optic_saas_orders') {
          return mapOrderToSupabase(item, boutiqueName)?.data?.value || item;
        } else if (key === 'optic_audit_logs') {
          return mapAuditLogToSupabase(item, boutiqueName)?.data?.value || item;
        } else if (key === 'optic_my_clinic_appointments') {
          return mapAppointmentToSupabase(item, boutiqueName)?.data?.value || item;
        } else if (key === 'optic_my_clinic_exams') {
          return mapSightExamToSupabase(item, boutiqueName)?.data?.value || item;
        } else if (key === 'optic_my_prescriptions') {
          return mapPrescriptionToSupabase(item, boutiqueName)?.data?.value || item;
        } else if (key === 'optic_hq_companies') {
          return mapCompanyToSupabase(item, boutiqueName)?.data?.value || item;
        } else if (key === 'optic_hq_branches') {
          return mapBranchToSupabase(item, boutiqueName)?.data?.value || item;
        }
        return item;
      }) : cleanData;

      let safePayloadData: any = mappedCleanData;
      try {
        safePayloadData = JSON.parse(JSON.stringify(mappedCleanData));
      } catch (e) {
        console.warn('[SUPABASE SYNC] JSON sanitization failed for fallback:', e);
      }

      const { error: firstError } = await supabaseClient
        .from('opticalize_sync')
        .upsert({
          collection_name: key,
          boutique_name: boutiqueName,
          data: { value: safePayloadData },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'collection_name,boutique_name'
        });

      let error = firstError;

      if (error) {
        console.warn(`[SUPABASE SYNC] First upsert attempt for "${key}" on conflict (collection_name,boutique_name) failed. Error:`, firstError);
        const retryResult = await supabaseClient
          .from('opticalize_sync')
          .upsert({
            collection_name: key,
            data: { value: safePayloadData },
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'collection_name'
          });
        
        if (!retryResult.error) {
          error = null; // Retry succeeded!
        } else {
          console.warn(`[SUPABASE SYNC] Retry upsert attempt for "${key}" on conflict (collection_name) also failed. Error:`, retryResult.error);
          error = firstError; // Fall back to displaying the primary more specific error
        }
      }

      if (!error) {
        syncSuccess = true;
      } else {
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          isSyncTableAvailable = false;
        } else {
          console.error(`[SUPABASE SYNC] Fallback syncing error for ${key}:`, error);
        }
      }
    }

    return syncSuccess;
  } catch (err: any) {
    console.error(`[SUPABASE SYNC] Exception during sync for "${key}":`, err?.message || err);
    return false;
  }
}

/**
 * Loads a synchronized collection from Supabase.
 */
export async function loadCollectionFromSupabase(key: string): Promise<any | null> {
  if (!supabaseClient) return null;

  const tableName = MAPPED_KEYS[key];
  const boutiqueName = safeLocalStorage.getItem('optic_boutique_name') || 'Global';

  try {
    if (tableName && !missingTables[tableName]) {
      try {
        const { data, error } = await supabaseClient
          .from(tableName)
          .select('data')
          .eq('boutique_name', boutiqueName);

        if (!error && data) {
          return data.map(row => unpackData(row.data));
        } else if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            missingTables[tableName] = true;
          }
        }
      } catch (tableNameErr) {
        missingTables[tableName] = true;
      }
    }

    if (isSyncTableAvailable) {
      let { data, error } = await supabaseClient
        .from('opticalize_sync')
        .select('data')
        .eq('collection_name', key)
        .eq('boutique_name', boutiqueName)
        .maybeSingle();

      if (error && error.code !== '42P01' && error.code !== 'PGRST205' && !error.message?.includes('does not exist')) {
        const retryResult = await supabaseClient
          .from('opticalize_sync')
          .select('data')
          .eq('collection_name', key)
          .maybeSingle();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (!error && data && data.data) {
        return unpackData(data.data);
      } else if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          isSyncTableAvailable = false;
        }
      }
    }
  } catch (err) {
    console.error(`[SUPABASE LOAD] Exception for "${key}":`, err);
  }

  return null;
}

/**
 * Initializes automatic synchronization of local storage changes.
 */
export function initializeAutomaticSupabaseSync() {
  if (!supabaseClient) {
    console.log('[SUPABASE AUTO-SYNC] Skipped. Credentials missing.');
    return;
  }
  // Remove any business keys stored physically in localStorage to comply with instructions
  const len = safeLocalStorage.getLength();
  for (let i = len - 1; i >= 0; i--) {
    const key = safeLocalStorage.key(i);
    if (key && isBusinessKey(key)) {
      safeLocalStorage.removeItem(key);
    }
  }
  console.log('[SUPABASE AUTO-SYNC] Cleaned physical local storage from all business operational data.');
}

/**
 * Fetches all synced collections from Supabase and populates global memory store on startup.
 */
export async function pullAllCollectionsFromSupabase(): Promise<boolean> {
  if (!supabaseClient) {
    updateSyncState({ loading: false, status: 'error', error: 'Client Supabase indisponible.' });
    return false;
  }

  updateSyncState({ loading: true, status: 'loading', error: null });
  console.log('[SUPABASE PULL] Synchronizing all operational modules directly from Supabase...');
  
  try {
    const boutiqueName = safeLocalStorage.getItem('optic_boutique_name') || 'Global';
    let updatedAny = false;

    // 1. Pull dedicated mapped tables
    for (const [key, tableName] of Object.entries(MAPPED_KEYS)) {
      try {
        const { data, error } = await supabaseClient
          .from(tableName)
          .select('data')
          .eq('boutique_name', boutiqueName);

        if (!error && data) {
          const unpackedItems = data.map(row => unpackData(row.data));
          const stringified = JSON.stringify(unpackedItems);
          if (globalMemoryStore[key] !== stringified) {
            globalMemoryStore[key] = stringified;
            updatedAny = true;
          }
        } else if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            missingTables[tableName] = true;
          }
        }
      } catch (err) {
        missingTables[tableName] = true;
      }
    }

    // 2. Pull remaining collections from opticalize_sync table
    if (isSyncTableAvailable) {
      let { data, error } = await supabaseClient
        .from('opticalize_sync')
        .select('collection_name, data')
        .eq('boutique_name', boutiqueName);

      if (error && error.code !== '42P01' && error.code !== 'PGRST205' && !error.message?.includes('does not exist')) {
        const retryResult = await supabaseClient
          .from('opticalize_sync')
          .select('collection_name, data');
        data = retryResult.data;
        error = retryResult.error;
      }

      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          const isMapped = !!MAPPED_KEYS[row.collection_name];
          const isMappedTableMissing = isMapped && missingTables[MAPPED_KEYS[row.collection_name]];

          if (SYNCABLE_KEYS.includes(row.collection_name) && (!isMapped || isMappedTableMissing)) {
            const unpacked = unpackData(row.data);
            const stringified = typeof unpacked === 'string' ? unpacked : JSON.stringify(unpacked);
            if (globalMemoryStore[row.collection_name] !== stringified) {
              globalMemoryStore[row.collection_name] = stringified;
              updatedAny = true;
            }
          }
        });
      } else if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          isSyncTableAvailable = false;
        }
      }
    }

    updateSyncState({
      loading: false,
      status: 'synced',
      error: null,
      lastSyncedAt: new Date().toLocaleTimeString()
    });

    if (updatedAny) {
      window.dispatchEvent(new Event('storage'));
    }
    return true;
  } catch (err: any) {
    console.error('[SUPABASE PULL] Exception during pull:', err);
    updateSyncState({
      loading: false,
      status: 'error',
      error: err.message || 'Erreur lors de la récupération des données.'
    });
    return false;
  }
}

/**
 * Pushes all currently stored global memory collections to Supabase.
 */
export async function pushAllCollectionsToSupabase(): Promise<boolean> {
  if (!supabaseClient) return false;

  console.log('[SUPABASE PUSH] Seeding global memory database state to cloud...');
  let successCount = 0;
  for (const key of SYNCABLE_KEYS) {
    const value = globalMemoryStore[key];
    if (value !== undefined) {
      const ok = await syncCollectionToSupabase(key, value);
      if (ok) successCount++;
    }
  }
  console.log(`[SUPABASE PUSH] Uploaded ${successCount}/${SYNCABLE_KEYS.length} collections.`);
  return successCount > 0;
}

/**
 * Set up real-time subscription for PostgreSQL database changes to support instant synchronization.
 */
export function subscribeToSupabaseRealtime() {
  if (!supabaseClient) return null;

  const channel = supabaseClient
    .channel('public_realtime_all_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        console.log('[SUPABASE REALTIME] Live database updates detected:', payload);
        // Silently pull updated collections to keep memory store completely aligned
        pullAllCollectionsFromSupabase().catch(err => {
          console.warn('[SUPABASE REALTIME PULL FAILED]', err);
        });
      }
    )
    .subscribe();

  return channel;
}

export function getSupabaseSetupSQL(): string {
  return `
-- SQL Schema to enable real-time cloud synchronization for Optic Alizé
CREATE TABLE IF NOT EXISTS public.opticalize_sync (
    collection_name text NOT NULL PRIMARY KEY,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.opticalize_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access" ON public.opticalize_sync FOR ALL USING (true) WITH CHECK (true);
  `;
}

/**
 * Debits a stock item in real-time from the 'optic_stock_items' collection.
 * It also inserts a log into 'optic_stock_history' to record the event.
 */
export async function debitStockItem(barcodeOrName: string, qtyToSubtract: number, details: string): Promise<boolean> {
  if (!barcodeOrName) return false;
  
  try {
    const savedStr = safeLocalStorage.getItem('optic_stock_items') || globalMemoryStore['optic_stock_items'];
    let stockItems: any[] = [];
    if (savedStr) {
      try {
        const parsed = JSON.parse(savedStr);
        if (Array.isArray(parsed)) stockItems = parsed;
      } catch (e) {}
    }

    if (stockItems.length === 0) {
      const dbItems = await loadCollectionFromSupabase('optic_stock_items');
      if (dbItems) {
        const parsed = typeof dbItems === 'string' ? JSON.parse(dbItems) : dbItems;
        if (Array.isArray(parsed) && parsed.length > 0) {
          stockItems = parsed;
        }
      }
    }

    if (stockItems.length === 0) {
      console.warn("[DEBIT STOCK] No stock items available to debit.");
      return false;
    }

    const lookup = String(barcodeOrName).trim().toLowerCase();
    let matchedItem = stockItems.find(item => item && item.barcode && String(item.barcode).trim() === lookup);
    if (!matchedItem) {
      matchedItem = stockItems.find(item => item && item.name && String(item.name).trim().toLowerCase() === lookup);
    }
    if (!matchedItem) {
      matchedItem = stockItems.find(item => item && item.name && String(item.name).trim().toLowerCase().includes(lookup));
    }
    if (!matchedItem) {
      matchedItem = stockItems.find(item => item && item.id && String(item.id).trim().toLowerCase() === lookup);
    }

    if (!matchedItem) {
      console.warn(`[DEBIT STOCK] No matching stock item found for query: ${barcodeOrName}`);
      return false;
    }

    const oldQty = Number(matchedItem.qty) || 0;
    const newQty = Math.max(0, oldQty - qtyToSubtract);
    matchedItem.qty = newQty;

    const serializedItems = JSON.stringify(stockItems);
    safeLocalStorage.setItem('optic_stock_items', serializedItems);
    globalMemoryStore['optic_stock_items'] = serializedItems;
    await syncCollectionToSupabase('optic_stock_items', serializedItems).catch(() => {});

    const savedHistoryStr = safeLocalStorage.getItem('optic_stock_history') || globalMemoryStore['optic_stock_history'];
    let historyEvents: any[] = [];
    if (savedHistoryStr) {
      try {
        const parsed = JSON.parse(savedHistoryStr);
        if (Array.isArray(parsed)) historyEvents = parsed;
      } catch (e) {}
    }

    const newEvent = {
      id: `evt-deb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      type: 'SORTIE',
      productName: matchedItem.name,
      qtyChange: -qtyToSubtract,
      detail: details,
      operator: safeLocalStorage.getItem('optic_user_email')?.split('@')[0] || 'Système',
      status: 'Complété'
    };

    historyEvents.unshift(newEvent);
    const serializedHistory = JSON.stringify(historyEvents);
    safeLocalStorage.setItem('optic_stock_history', serializedHistory);
    globalMemoryStore['optic_stock_history'] = serializedHistory;
    await syncCollectionToSupabase('optic_stock_history', serializedHistory).catch(() => {});

    window.dispatchEvent(new Event('storage'));
    console.log(`[DEBIT STOCK] Successfully debited ${qtyToSubtract} from ${matchedItem.name}. New qty: ${newQty}`);
    return true;
  } catch (err) {
    console.error("[DEBIT STOCK] Error debiting stock item:", err);
    return false;
  }
}
