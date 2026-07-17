import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  mapEmployeeToSupabase,
  mapAttendanceToSupabase,
  mapLeaveToSupabase,
  mapAdjustmentToSupabase,
  mapPayslipToSupabase,
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

export const supabaseClient: SupabaseClient | null = (envUrl && envAnonKey)
  ? createClient(envUrl, envAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

if (supabaseClient) {
  console.log('[SUPABASE SERVICE] Successfully initialized unified client.');
} else {
  console.log('[SUPABASE SERVICE] Pending configuration.');
}

// Map the business localStorage keys to dedicated PostgreSQL tables in Supabase
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

const missingTables: Record<string, boolean> = {};
let isSyncTableAvailable = true;

/**
 * Unpacks the data stored in Supabase's JSONB column.
 */
function unpackData(dbData: any): any {
  if (dbData && typeof dbData === 'object' && dbData !== null && 'value' in dbData) {
    return dbData.value;
  }
  return dbData;
}

export const SupabaseService = {
  client: supabaseClient,

  isConfigured(): boolean {
    return supabaseClient !== null;
  },

  async autoCreateTableOnBackend(tableName: string): Promise<boolean> {
    try {
      console.log(`[SUPABASE SERVICE] Table "${tableName}" does not exist. Triggering automatic backend creation...`);
      const res = await fetch('/api/database/create-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tableName })
      });
      const data = await res.json();
      if (data && data.success) {
        console.log(`[SUPABASE SERVICE] Table "${tableName}" created successfully on backend!`);
        delete missingTables[tableName];
        return true;
      } else {
        console.warn(`[SUPABASE SERVICE] Backend failed to create table "${tableName}":`, data?.error || 'Unknown error');
      }
    } catch (e) {
      console.error(`[SUPABASE SERVICE] Exception triggering automatic table creation for "${tableName}":`, e);
    }
    return false;
  },

  /**
   * Generic GET request for a single record from a PostgreSQL table
   */
  async get<T = any>(table: string, id: string): Promise<T | null> {
    if (!supabaseClient) return null;
    try {
      const { data, error } = await supabaseClient
        .from(table)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`[SUPABASE SERVICE] Get error on table ${table} for id ${id}:`, error);
        return null;
      }
      return data as T;
    } catch (err) {
      console.error(`[SUPABASE SERVICE] Exception in get on table ${table}:`, err);
      return null;
    }
  },

  /**
   * Generic CREATE/INSERT request for a single record in a PostgreSQL table
   */
  async create<T = any>(table: string, record: T): Promise<boolean> {
    if (!supabaseClient) return false;
    try {
      const { error } = await supabaseClient
        .from(table)
        .insert(record as any);

      if (error) {
        console.error(`[SUPABASE SERVICE] Create error on table ${table}:`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[SUPABASE SERVICE] Exception in create on table ${table}:`, err);
      return false;
    }
  },

  /**
   * Generic UPDATE request for a single record in a PostgreSQL table
   */
  async update<T = any>(table: string, id: string, record: Partial<T>): Promise<boolean> {
    if (!supabaseClient) return false;
    try {
      const { error } = await supabaseClient
        .from(table)
        .update(record as any)
        .eq('id', id);

      if (error) {
        console.error(`[SUPABASE SERVICE] Update error on table ${table} for id ${id}:`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[SUPABASE SERVICE] Exception in update on table ${table}:`, err);
      return false;
    }
  },

  /**
   * Generic DELETE request for a single record in a PostgreSQL table
   */
  async delete(table: string, id: string): Promise<boolean> {
    if (!supabaseClient) return false;
    try {
      const { error } = await supabaseClient
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`[SUPABASE SERVICE] Delete error on table ${table} for id ${id}:`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[SUPABASE SERVICE] Exception in delete on table ${table}:`, err);
      return false;
    }
  },

  /**
   * Generic LIST/SELECT request with optional tenancy (boutique/company) filtering,
   * server-side pagination, and custom order sorting.
   */
  async list<T = any>(
    table: string,
    options?: { 
      boutique_name?: string; 
      company_id?: string; 
      branch_id?: string;
      page?: number;
      limit?: number;
      orderBy?: string;
      orderAscending?: boolean;
    }
  ): Promise<T[]> {
    if (!supabaseClient) return [];
    try {
      let query = supabaseClient.from(table).select('*');

      if (options?.boutique_name && table !== 'users_profiles' && table !== 'employees') {
        query = query.eq('boutique_name', options.boutique_name);
      }
      if (options?.company_id) {
        query = query.eq('company_id', options.company_id);
      }
      if (options?.branch_id) {
        query = query.eq('branch_id', options.branch_id);
      }

      // Order by specified column or default to updated_at
      const orderBy = options?.orderBy || 'updated_at';
      const orderAscending = options?.orderAscending !== undefined ? options.orderAscending : false;
      query = query.order(orderBy, { ascending: orderAscending });

      // Handle server-side pagination
      if (options?.page && options?.limit) {
        const from = (options.page - 1) * options.limit;
        const to = options.page * options.limit - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`[SUPABASE SERVICE] List error on table ${table}:`, error);
        return [];
      }
      return (data || []) as T[];
    } catch (err) {
      console.error(`[SUPABASE SERVICE] Exception in list on table ${table}:`, err);
      return [];
    }
  },

  /**
   * Generic PAGINATED LIST/SELECT request returning data and exact total records count.
   */
  async listPaginated<T = any>(
    table: string,
    options?: { 
      boutique_name?: string; 
      company_id?: string; 
      branch_id?: string;
      page?: number;
      limit?: number;
      orderBy?: string;
      orderAscending?: boolean;
    }
  ): Promise<{ data: T[]; count: number }> {
    if (!supabaseClient) return { data: [], count: 0 };
    try {
      let query = supabaseClient.from(table).select('*', { count: 'exact' });

      if (options?.boutique_name && table !== 'users_profiles' && table !== 'employees') {
        query = query.eq('boutique_name', options.boutique_name);
      }
      if (options?.company_id) {
        query = query.eq('company_id', options.company_id);
      }
      if (options?.branch_id) {
        query = query.eq('branch_id', options.branch_id);
      }

      // Order by specified column or default to updated_at
      const orderBy = options?.orderBy || 'updated_at';
      const orderAscending = options?.orderAscending !== undefined ? options.orderAscending : false;
      query = query.order(orderBy, { ascending: orderAscending });

      // Handle server-side pagination
      if (options?.page && options?.limit) {
        const from = (options.page - 1) * options.limit;
        const to = options.page * options.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      if (error) {
        console.error(`[SUPABASE SERVICE] ListPaginated error on table ${table}:`, error);
        return { data: [], count: 0 };
      }
      return {
        data: (data || []) as T[],
        count: count || 0
      };
    } catch (err) {
      console.error(`[SUPABASE SERVICE] Exception in listPaginated on table ${table}:`, err);
      return { data: [], count: 0 };
    }
  },

  /**
   * Sync a specific collection's datasets to PostgreSQL tables.
   */
  async syncCollection(key: string, data: any, boutiqueName: string = 'Global'): Promise<boolean> {
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
      let syncSuccess = false;

      if (tableName && !missingTables[tableName]) {
        try {
          const items = Array.isArray(cleanData) ? cleanData : [cleanData];
          let hasError = false;

          for (const item of items) {
            if (!item || typeof item !== 'object') continue;
            const itemId = item.id || item.email || `gen-${Math.floor(Math.random() * 1000000)}`;

            // Apply schema mapping based on tables
            let mappedItem = item;
            if (tableName === 'employees') {
              mappedItem = mapEmployeeToSupabase(item) || item;
            } else if (tableName === 'attendance') {
              mappedItem = mapAttendanceToSupabase(item) || item;
            } else if (tableName === 'leaves') {
              mappedItem = mapLeaveToSupabase(item) || item;
            } else if (tableName === 'adjustments') {
              mappedItem = mapAdjustmentToSupabase(item) || item;
            } else if (tableName === 'payslips') {
              mappedItem = mapPayslipToSupabase(item) || item;
            } else if (tableName === 'users_profiles') {
              mappedItem = mapUserToSupabase(item) || item;
            } else {
              // Document-based tables mappers
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
            }

            const isRelational = ['employees', 'attendance', 'leaves', 'adjustments', 'payslips', 'users_profiles'].includes(tableName);
            
            // Build the exact record structure for the PostgreSQL target
            const payload = isRelational
              ? {
                  ...mappedItem,
                  id: String(itemId),
                  updated_at: new Date().toISOString()
                }
              : {
                  id: String(itemId),
                  boutique_name: boutiqueName,
                  data: { value: mappedItem },
                  updated_at: new Date().toISOString()
                };

            let { error: upsertErr } = await supabaseClient
              .from(tableName)
              .upsert(payload, { onConflict: 'id' });

            if (upsertErr) {
              console.warn(`[SUPABASE SERVICE WARNING] Table ${tableName} upsert failed:`, upsertErr);
              if (upsertErr.code === '42P01' || upsertErr.message?.includes('does not exist')) {
                const created = await this.autoCreateTableOnBackend(tableName);
                if (created) {
                  const retryRes = await supabaseClient
                    .from(tableName)
                    .upsert(payload, { onConflict: 'id' });
                  if (!retryRes.error) {
                    upsertErr = null;
                  }
                }
              }
              if (upsertErr) {
                missingTables[tableName] = true;
                hasError = true;
                break;
              }
            }
          }
          if (!hasError) {
            syncSuccess = true;
          }
        } catch (tableNameErr) {
          console.warn(`[SUPABASE SERVICE] Table ${tableName} not accessible, falling back.`, tableNameErr);
          missingTables[tableName] = true;
        }
      }

      // Fallback to central opticalize_sync table
      if (!syncSuccess && isSyncTableAvailable) {
        const mappedCleanData = Array.isArray(cleanData)
          ? cleanData.map((item: any) => {
              if (!item || typeof item !== 'object') return item;
              const mappedTableName = MAPPED_KEYS[key];
              if (mappedTableName === 'employees') return mapEmployeeToSupabase(item) || item;
              if (mappedTableName === 'attendance') return mapAttendanceToSupabase(item) || item;
              if (mappedTableName === 'leaves') return mapLeaveToSupabase(item) || item;
              if (mappedTableName === 'adjustments') return mapAdjustmentToSupabase(item) || item;
              if (mappedTableName === 'payslips') return mapPayslipToSupabase(item) || item;
              if (mappedTableName === 'users_profiles') return mapUserToSupabase(item) || item;

              if (key === 'optic_crm_customers') return mapCustomerToSupabase(item, boutiqueName)?.data?.value || item;
              if (key === 'optic_fused_catalog') return mapProductToSupabase(item, boutiqueName)?.data?.value || item;
              if (key === 'optic_saas_orders') return mapOrderToSupabase(item, boutiqueName)?.data?.value || item;
              if (key === 'optic_audit_logs') return mapAuditLogToSupabase(item, boutiqueName)?.data?.value || item;
              if (key === 'optic_my_clinic_appointments') return mapAppointmentToSupabase(item, boutiqueName)?.data?.value || item;
              if (key === 'optic_my_clinic_exams') return mapSightExamToSupabase(item, boutiqueName)?.data?.value || item;
              if (key === 'optic_my_prescriptions') return mapPrescriptionToSupabase(item, boutiqueName)?.data?.value || item;
              if (key === 'optic_hq_companies') return mapCompanyToSupabase(item, boutiqueName)?.data?.value || item;
              if (key === 'optic_hq_branches') return mapBranchToSupabase(item, boutiqueName)?.data?.value || item;
              return item;
            })
          : cleanData;

        let safePayloadData: any = mappedCleanData;
        try {
          safePayloadData = JSON.parse(JSON.stringify(mappedCleanData));
        } catch (e) {
          console.warn('[SUPABASE SERVICE] JSON sanitization failed for fallback:', e);
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
            error = null;
          } else {
            error = firstError;
          }
        }

        if (!error) {
          syncSuccess = true;
        } else {
          if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
            isSyncTableAvailable = false;
          }
        }
      }

      return syncSuccess;
    } catch (err: any) {
      console.error(`[SUPABASE SERVICE] Exception during sync for "${key}":`, err?.message || err);
      return false;
    }
  },

  /**
   * Loads a synchronized collection from Supabase with optional server-side pagination and sorting.
   */
  async loadCollection(
    key: string,
    boutiqueName: string = 'Global',
    options?: { page?: number; limit?: number; orderBy?: string; orderAscending?: boolean }
  ): Promise<any | null> {
    if (!supabaseClient) return null;

    const tableName = MAPPED_KEYS[key];

    try {
      if (tableName && !missingTables[tableName]) {
        try {
          if (['employees', 'attendance', 'leaves', 'adjustments', 'payslips', 'users_profiles'].includes(tableName)) {
            // Relational tables don't have a boutique_name directly but we can query everything and pack/format it
            let query = supabaseClient.from(tableName).select('*');

            const orderBy = options?.orderBy || 'updated_at';
            const orderAscending = options?.orderAscending !== undefined ? options.orderAscending : false;
            query = query.order(orderBy, { ascending: orderAscending });

            if (options?.page && options?.limit) {
              const from = (options.page - 1) * options.limit;
              const to = options.page * options.limit - 1;
              query = query.range(from, to);
            }

            let { data, error } = await query;
            if (error) {
              if (error.code === '42P01' || error.message?.includes('does not exist')) {
                const created = await this.autoCreateTableOnBackend(tableName);
                if (created) {
                  let retryQuery = supabaseClient.from(tableName).select('*');
                  retryQuery = retryQuery.order(orderBy, { ascending: orderAscending });
                  if (options?.page && options?.limit) {
                    const from = (options.page - 1) * options.limit;
                    const to = options.page * options.limit - 1;
                    retryQuery = retryQuery.range(from, to);
                  }
                  const retryRes = await retryQuery;
                  data = retryRes.data;
                  error = retryRes.error;
                }
              }
            }

            if (!error && data) {
              return data;
            } else if (error) {
              if (error.code === '42P01' || error.message?.includes('does not exist')) {
                missingTables[tableName] = true;
              }
            }
          } else {
            // Document tables
            let query = supabaseClient.from(tableName).select('*').eq('boutique_name', boutiqueName);

            const orderBy = options?.orderBy || 'updated_at';
            const orderAscending = options?.orderAscending !== undefined ? options.orderAscending : false;
            query = query.order(orderBy, { ascending: orderAscending });

            if (options?.page && options?.limit) {
              const from = (options.page - 1) * options.limit;
              const to = options.page * options.limit - 1;
              query = query.range(from, to);
            }

            let { data, error } = await query;
            if (error) {
              if (error.code === '42P01' || error.message?.includes('does not exist')) {
                const created = await this.autoCreateTableOnBackend(tableName);
                if (created) {
                  let retryQuery = supabaseClient.from(tableName).select('*').eq('boutique_name', boutiqueName);
                  retryQuery = retryQuery.order(orderBy, { ascending: orderAscending });
                  if (options?.page && options?.limit) {
                    const from = (options.page - 1) * options.limit;
                    const to = options.page * options.limit - 1;
                    retryQuery = retryQuery.range(from, to);
                  }
                  const retryRes = await retryQuery;
                  data = retryRes.data;
                  error = retryRes.error;
                }
              }
            }

            if (!error && data) {
              return data.map(row => unpackData(row.data));
            } else if (error) {
              if (error.code === '42P01' || error.message?.includes('does not exist')) {
                missingTables[tableName] = true;
              }
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
          const unpacked = unpackData(data.data);
          if (Array.isArray(unpacked) && options?.page && options?.limit) {
            const from = (options.page - 1) * options.limit;
            const to = options.page * options.limit;
            return unpacked.slice(from, to);
          }
          return unpacked;
        } else if (error) {
          if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
            isSyncTableAvailable = false;
          }
        }
      }
    } catch (err) {
      console.error(`[SUPABASE SERVICE LOAD] Exception for "${key}":`, err);
    }

    return null;
  }
};
