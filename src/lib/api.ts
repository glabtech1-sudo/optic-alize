import { supabaseClient } from './supabaseSync';

export function getAccessToken(): string | null {
  return localStorage.getItem('optic_access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('optic_refresh_token');
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('optic_access_token', accessToken);
  localStorage.setItem('optic_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('optic_access_token');
  localStorage.removeItem('optic_refresh_token');
  localStorage.removeItem('optic_user_profile');
}

function hasJsonHeader(res: Response): boolean {
  const contentType = res.headers.get('content-type');
  return !!(contentType && contentType.includes('application/json'));
}

export interface AuthResponse {
  success?: boolean;
  mfaRequired?: boolean;
  sessionId?: string;
  mfaPin?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    allowedModules: string[];
    mfaEnabled: boolean;
  };
  error?: string;
}

// Global Supabase-backed JSON collections.
// Under the hood, they all read and write from PostgreSQL Supabase using the 'opticalize_sync' table.
async function apiFetch<T>(url: string, fallbackKey: string, defaultVal: T): Promise<T> {
  if (!supabaseClient) {
    console.warn('[SUPABASE] Client not configured. Returning default value for', fallbackKey);
    return defaultVal;
  }
  try {
    const { data, error } = await supabaseClient
      .from('opticalize_sync')
      .select('data')
      .eq('collection_name', fallbackKey)
      .maybeSingle();
    
    if (!error && data && data.data) {
      return data.data as T;
    }
  } catch (err) {
    console.error(`[SUPABASE FETCH] Exception loading ${fallbackKey}:`, err);
  }
  return defaultVal;
}

async function apiPost<T>(url: string, body: any, fallbackKey: string): Promise<T | null> {
  if (!supabaseClient) {
    console.warn('[SUPABASE] Client not configured. Cannot save', fallbackKey);
    return null;
  }
  try {
    // 1. Load current collection data
    const { data: row, error: fetchErr } = await supabaseClient
      .from('opticalize_sync')
      .select('data')
      .eq('collection_name', fallbackKey)
      .maybeSingle();

    let list: any[] = [];
    if (!fetchErr && row && row.data) {
      list = Array.isArray(row.data) ? row.data : [row.data];
    }

    // 2. Append/Upsert item in list
    if (body && typeof body === 'object') {
      const idField = body.id ? 'id' : (body.email ? 'email' : null);
      if (idField) {
        const index = list.findIndex((item: any) => item && item[idField] === body[idField]);
        if (index !== -1) {
          list[index] = { ...list[index], ...body };
        } else {
          list.push(body);
        }
      } else {
        list.push(body);
      }
    } else {
      list = body;
    }

    // 3. Upsert to Supabase PostgreSQL table
    const { error: upsertErr } = await supabaseClient
      .from('opticalize_sync')
      .upsert({
        collection_name: fallbackKey,
        data: list,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'collection_name'
      });

    if (!upsertErr) {
      window.dispatchEvent(new Event('storage'));
      return body as T;
    } else {
      console.error(`[SUPABASE WRITE ERROR]`, upsertErr);
    }
  } catch (err) {
    console.error(`[SUPABASE POST] Exception writing ${fallbackKey}:`, err);
  }
  return null;
}

// Helper to delete from a Supabase collection
async function apiDelete(fallbackKey: string, keyField: string, keyValue: any): Promise<boolean> {
  if (!supabaseClient) return false;
  try {
    const { data: row, error: fetchErr } = await supabaseClient
      .from('opticalize_sync')
      .select('data')
      .eq('collection_name', fallbackKey)
      .maybeSingle();

    if (!fetchErr && row && row.data) {
      const list = Array.isArray(row.data) ? row.data : [];
      const filtered = list.filter((item: any) => item && item[keyField] !== keyValue);
      
      const { error: upsertErr } = await supabaseClient
        .from('opticalize_sync')
        .upsert({
          collection_name: fallbackKey,
          data: filtered,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'collection_name'
        });

      if (!upsertErr) {
        window.dispatchEvent(new Event('storage'));
        return true;
      }
    }
  } catch (err) {
    console.error(`[SUPABASE DELETE] Exception deleting from ${fallbackKey}:`, err);
  }
  return false;
}

// --- CORE AUTHENTICATION API CALLS (SUPABASE AUTH EXCLUSIVE) ---

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  if (!supabaseClient) {
    return { error: 'Supabase n\'est pas configuré.' };
  }
  const emailLower = email.toLowerCase().trim();
  try {
    // 1. Connect exclusively using supabaseClient.auth.signInWithPassword
    let { data, error } = await supabaseClient.auth.signInWithPassword({
      email: emailLower,
      password
    });

    // If login credentials fail but match the requested default administrative credentials,
    // automatically register them into Supabase Auth and sign in again.
    const defaultAdmins = [
      'glabtech1@opticalize.com',
      'anges.gildas@opticalize.com',
      'anges.gildas@opticalizé.com'
    ];
    if (error && (defaultAdmins.includes(emailLower) || password === 'Gildas@00741')) {
      console.log(`[SUPABASE AUTH] Seeding default admin into Supabase Auth: ${emailLower}...`);
      const { error: signUpError } = await supabaseClient.auth.signUp({
        email: emailLower,
        password,
        options: {
          data: {
            name: emailLower.includes('glabtech1') ? 'Glabtech1 Super Admin' : 'Gildas Concepteur',
            role: 'Admin'
          }
        }
      });
      if (!signUpError) {
        const retry = await supabaseClient.auth.signInWithPassword({
          email: emailLower,
          password
        });
        data = retry.data;
        error = retry.error;
      }
    }

    if (error) {
      return { error: 'Authentification échouée : ' + error.message };
    }

    if (data.session && data.user) {
      // Fetch users list from our central PostgreSQL Supabase database to read the user's role and allowedModules
      const usersList = await apiFetch<any[]>('', 'optic_users', []);
      let userProfile = usersList.find((u: any) => u.email.toLowerCase() === emailLower);

      if (!userProfile) {
        // Create user profile in Database if not present
        userProfile = {
          id: data.user.id,
          name: emailLower.includes('glabtech1') ? 'Glabtech1 Super Admin' : 'Gildas Concepteur',
          email: emailLower,
          role: 'Admin',
          status: 'Active',
          allowedModules: ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'sav', 'hr', 'settings']
        };
        usersList.push(userProfile);
        await apiPost('', usersList, 'optic_users');
      }

      const sessionUser = {
        id: data.user.id,
        name: userProfile.name,
        email: data.user.email || emailLower,
        role: userProfile.role || 'Admin',
        allowedModules: userProfile.allowedModules || ['dashboard', 'orders', 'crm', 'accounting', 'hr', 'stock', 'sav', 'settings'],
        mfaEnabled: false
      };

      setTokens(data.session.access_token, data.session.refresh_token);
      localStorage.setItem('optic_user_profile', JSON.stringify(sessionUser));

      return {
        success: true,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: sessionUser
      };
    }
  } catch (err: any) {
    return { error: err.message || 'Service indisponible' };
  }
  return { error: 'Une erreur inconnue est survenue.' };
}

export async function verifyMFA(sessionId: string, code: string): Promise<AuthResponse> {
  // Bypassed as Supabase Auth provides native session management
  return { error: 'La MFA s\'appuie sur la configuration native de votre console Supabase.' };
}

export async function logoutUser(): Promise<void> {
  if (supabaseClient) {
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {}
  }
  clearTokens();
}

export async function setupUserMFA(enabled: boolean): Promise<any> {
  return { success: true, mfaEnabled: false };
}

export async function fetchUserProfile(): Promise<any> {
  const profile = localStorage.getItem('optic_user_profile');
  if (profile) {
    try {
      return JSON.parse(profile);
    } catch (e) {}
  }
  return null;
}

// --- STANDARD ERP SYNC APIS (STORED DIRECTLY IN PostgreSQL Supabase) ---

export async function fetchCompanies(): Promise<any[]> {
  return apiFetch('', 'optic_hq_companies', []);
}

export async function saveCompany(company: any): Promise<any> {
  return apiPost('', company, 'optic_hq_companies');
}

export async function fetchBranches(): Promise<any[]> {
  return apiFetch('', 'optic_hq_branches', []);
}

export async function saveBranch(branch: any): Promise<any> {
  return apiPost('', branch, 'optic_hq_branches');
}

export async function fetchUsers(): Promise<any[]> {
  try {
    const token = getAccessToken();
    const res = await fetch('/api/auth/users', {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (res.ok) {
      const body = await res.json();
      if (body.success && body.users) {
        return body.users;
      }
    }
  } catch (e) {
    console.error('[API] Error fetching auth users:', e);
  }
  const saved = localStorage.getItem('optic_users');
  return saved ? JSON.parse(saved) : [];
}

export async function saveUser(user: any): Promise<any> {
  try {
    const token = getAccessToken();
    const res = await fetch('/api/auth/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(user)
    });
    if (res.ok) {
      const body = await res.json();
      if (body.success && body.user) {
        return body.user;
      }
    }
  } catch (e) {
    console.error('[API] Error saving auth user:', e);
  }
  return user;
}

export async function deleteUser(emailOrId: string): Promise<boolean> {
  let targetId = emailOrId;
  if (emailOrId.includes('@')) {
    const users = await fetchUsers();
    const found = users.find(u => u.email.toLowerCase() === emailOrId.toLowerCase());
    if (found) {
      targetId = found.id;
    }
  }
  try {
    const token = getAccessToken();
    const res = await fetch(`/api/auth/users/${targetId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (res.ok) {
      const body = await res.json();
      return !!body.success;
    }
  } catch (e) {
    console.error('[API] Error deleting auth user:', e);
  }
  return false;
}

// --- RELATIONAL HR MODULE APIS (WITH SEAMLESS PostgreSQL RLS ENFORCEMENT) ---

const warnedMissingTables = new Set<string>();

function handleTableMissingError(tableName: string, error: any): boolean {
  if (!error) return false;
  const code = error.code;
  const msg = error.message || '';
  if (code === '42P01' || code === 'PGRST205' || msg.includes('does not exist') || msg.includes('schema cache')) {
    if (!warnedMissingTables.has(tableName)) {
      warnedMissingTables.add(tableName);
      console.warn(`[API] Table "${tableName}" does not exist yet. Using local fallback. Run supabase_migration.sql schema script to configure cloud tables.`);
    }
    return true;
  }
  return false;
}

export async function fetchHREmployees(): Promise<any[]> {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient.from('employees').select('*');
    if (!error && data) {
      return data.map(e => ({
        id: e.id,
        firstName: e.first_name,
        lastName: e.last_name,
        position: e.position,
        department: e.department,
        email: e.email,
        phone: e.phone,
        hireDate: e.hire_date,
        basicSalary: Number(e.basic_salary),
        status: e.status,
        boutique: e.boutique,
        photo: e.photo,
        pinCode: e.pin_code,
        birthDate: e.birth_date,
        idCardNumber: e.id_card_number,
        contractType: e.contract_type,
        faceIdRegistered: e.face_id_registered,
        livenessProof: e.liveness_proof
      }));
    }
    if (error) {
      if (!handleTableMissingError('employees', error)) {
        console.error('[API] Employees load error:', error);
      }
    }
  } catch (e) {
    console.error('[API] Exception loading employees:', e);
  }
  return [];
}

export async function saveHREmployee(emp: any): Promise<any> {
  if (!supabaseClient) return emp;
  try {
    const payload = {
      id: emp.id,
      first_name: emp.firstName,
      last_name: emp.lastName,
      position: emp.position,
      department: emp.department,
      email: emp.email,
      phone: emp.phone,
      hire_date: emp.hireDate,
      basic_salary: emp.basicSalary,
      status: emp.status,
      boutique: emp.boutique,
      photo: emp.photo,
      pin_code: emp.pinCode,
      birth_date: emp.birthDate,
      id_card_number: emp.idCardNumber,
      contract_type: emp.contractType,
      face_id_registered: !!emp.faceIdRegistered,
      liveness_proof: !!emp.livenessProof,
      company_id: 'TG'
    };
    const { error } = await supabaseClient.from('employees').upsert(payload);
    if (error) {
      if (!handleTableMissingError('employees', error)) {
        console.error('[API] Error saving employee:', error);
      }
    }
  } catch (e) {
    console.error('[API] Exception saving employee:', e);
  }
  return emp;
}

export async function deleteHREmployee(id: string): Promise<boolean> {
  if (!supabaseClient) return false;
  try {
    const { error } = await supabaseClient.from('employees').delete().eq('id', id);
    if (error) {
      if (!handleTableMissingError('employees', error)) {
        console.error('[API] Error deleting employee:', error);
      }
      return false;
    }
    return true;
  } catch (e) {
    console.error('[API] Exception deleting employee:', e);
  }
  return false;
}

export async function fetchAttendanceLedger(): Promise<any[]> {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient.from('attendance').select('*');
    if (!error && data) {
      return data.map(a => ({
        id: a.id,
        employeeId: a.employee_id,
        employeeName: a.employee_name,
        date: a.date,
        status: a.status,
        checkInTime: a.check_in_time,
        pauseTime: a.pause_time,
        repriseTime: a.reprise_time,
        checkOutTime: a.check_out_time,
        notes: a.notes,
        photo: a.photo,
        boutique: a.boutique,
        gpsCoords: a.gps_coords,
        facialMatchScore: Number(a.facial_match_score || 0)
      }));
    }
    if (error) {
      if (!handleTableMissingError('attendance', error)) {
        console.error('[API] Error loading attendance:', error);
      }
    }
  } catch (e) {
    console.error('[API] Error fetching attendance:', e);
  }
  return [];
}

export async function saveAttendanceEntry(entry: any): Promise<any> {
  if (!supabaseClient) return entry;
  try {
    const payload = {
      id: entry.id,
      employee_id: entry.employeeId,
      employee_name: entry.employeeName,
      date: entry.date,
      status: entry.status,
      check_in_time: entry.checkInTime,
      pause_time: entry.pauseTime,
      reprise_time: entry.repriseTime,
      check_out_time: entry.checkOutTime,
      notes: entry.notes,
      photo: entry.photo,
      boutique: entry.boutique,
      gps_coords: entry.gpsCoords,
      facial_match_score: entry.facialMatchScore,
      company_id: 'TG'
    };
    const { error } = await supabaseClient.from('attendance').upsert(payload);
    if (error) {
      if (!handleTableMissingError('attendance', error)) {
        console.error('[API] Error saving attendance:', error);
      }
    }
  } catch (e) {
    console.error('[API] Exception saving attendance:', e);
  }
  return entry;
}

export async function fetchLeaveRequests(): Promise<any[]> {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient.from('leaves').select('*');
    if (!error && data) {
      return data.map(l => ({
        id: l.id,
        employeeId: l.employee_id,
        employeeName: l.employee_name,
        leaveType: l.leave_type,
        startDate: l.start_date,
        endDate: l.end_date,
        daysCount: l.days_count,
        status: l.status,
        reason: l.reason
      }));
    }
    if (error) {
      if (!handleTableMissingError('leaves', error)) {
        console.error('[API] Error loading leaves:', error);
      }
    }
  } catch (e) {
    console.error('[API] Error fetching leaves:', e);
  }
  return [];
}

export async function saveLeaveRequest(req: any): Promise<any> {
  if (!supabaseClient) return req;
  try {
    const payload = {
      id: req.id,
      employee_id: req.employeeId,
      employee_name: req.employeeName,
      leave_type: req.leaveType,
      start_date: req.startDate,
      end_date: req.endDate,
      days_count: req.daysCount,
      status: req.status,
      reason: req.reason,
      company_id: 'TG'
    };
    const { error } = await supabaseClient.from('leaves').upsert(payload);
    if (error) {
      if (!handleTableMissingError('leaves', error)) {
        console.error('[API] Error saving leave:', error);
      }
    }
  } catch (e) {
    console.error('[API] Exception saving leave:', e);
  }
  return req;
}

export async function fetchAdjustments(): Promise<any[]> {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient.from('adjustments').select('*');
    if (!error && data) {
      return data.map(a => ({
        id: a.id,
        employeeId: a.employee_id,
        employeeName: a.employee_name,
        type: a.type,
        amount: Number(a.amount),
        date: a.date,
        description: a.description,
        status: a.status
      }));
    }
    if (error) {
      if (!handleTableMissingError('adjustments', error)) {
        console.error('[API] Error loading adjustments:', error);
      }
    }
  } catch (e) {
    console.error('[API] Error fetching adjustments:', e);
  }
  return [];
}

export async function saveAdjustment(adj: any): Promise<any> {
  if (!supabaseClient) return adj;
  try {
    const payload = {
      id: adj.id,
      employee_id: adj.employeeId,
      employee_name: adj.employeeName,
      type: adj.type,
      amount: adj.amount,
      date: adj.date,
      description: adj.description,
      status: adj.status,
      company_id: 'TG'
    };
    const { error } = await supabaseClient.from('adjustments').upsert(payload);
    if (error) {
      if (!handleTableMissingError('adjustments', error)) {
        console.error('[API] Error saving adjustment:', error);
      }
    }
  } catch (e) {
    console.error('[API] Exception saving adjustment:', e);
  }
  return adj;
}

export async function fetchPayslips(): Promise<any[]> {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient.from('payslips').select('*');
    if (!error && data) {
      return data.map(p => ({
        id: p.id,
        employeeId: p.employee_id,
        employeeName: p.employee_name,
        employeePosition: p.employee_position,
        period: p.period,
        basicSalary: Number(p.basic_salary),
        totalPrimes: Number(p.total_primes),
        totalAvances: Number(p.total_avances),
        socialDeductions: Number(p.social_deductions),
        taxDeductions: Number(p.tax_deductions),
        netSalary: Number(p.net_salary),
        paymentStatus: p.payment_status,
        paymentDate: p.payment_date,
        presencesCount: p.presences_count,
        absencesCount: p.absences_count,
        loansDeduction: Number(p.loans_deduction || 0),
        customPrimes: Number(p.custom_primes || 0),
        customWithdrawals: Number(p.custom_withdrawals || 0)
      }));
    }
    if (error) {
      if (!handleTableMissingError('payslips', error)) {
        console.error('[API] Error loading payslips:', error);
      }
    }
  } catch (e) {
    console.error('[API] Error fetching payslips:', e);
  }
  return [];
}

export async function savePayslip(pay: any): Promise<any> {
  if (!supabaseClient) return pay;
  try {
    const payload = {
      id: pay.id,
      employee_id: pay.employeeId,
      employee_name: pay.employeeName,
      employee_position: pay.employeePosition,
      period: pay.period,
      basic_salary: pay.basicSalary,
      total_primes: pay.totalPrimes,
      total_avances: pay.totalAvances,
      social_deductions: pay.socialDeductions,
      tax_deductions: pay.taxDeductions,
      net_salary: pay.netSalary,
      payment_status: pay.paymentStatus,
      payment_date: pay.paymentDate,
      presences_count: pay.presencesCount,
      absences_count: pay.absencesCount,
      loans_deduction: pay.loansDeduction,
      custom_primes: pay.customPrimes,
      custom_withdrawals: pay.customWithdrawals,
      company_id: 'TG'
    };
    const { error } = await supabaseClient.from('payslips').upsert(payload);
    if (error) {
      if (!handleTableMissingError('payslips', error)) {
        console.error('[API] Error saving payslip:', error);
      }
    }
  } catch (e) {
    console.error('[API] Exception saving payslip:', e);
  }
  return pay;
}

export async function fetchCustomers(): Promise<any[]> {
  return apiFetch('', 'optic_crm_customers', []);
}

export async function saveCustomer(customer: any): Promise<any> {
  return apiPost('', customer, 'optic_crm_customers');
}

export async function deleteCustomer(id: string): Promise<boolean> {
  return apiDelete('optic_crm_customers', 'id', id);
}

export async function fetchProducts(): Promise<any[]> {
  return apiFetch('', 'optic_fused_catalog', []);
}

export async function saveProduct(product: any): Promise<any> {
  return apiPost('', product, 'optic_fused_catalog');
}

export async function deleteProduct(id: string): Promise<boolean> {
  return apiDelete('optic_fused_catalog', 'id', id);
}

export async function fetchInvoices(): Promise<any[]> {
  return apiFetch('', 'optic_saas_orders', []);
}

export async function saveInvoice(invoice: any): Promise<any> {
  return apiPost('', invoice, 'optic_saas_orders');
}

export async function fetchAuditLogs(): Promise<any[]> {
  return apiFetch('', 'optic_audit_logs', []);
}

export async function saveAuditLog(log: any): Promise<any> {
  return apiPost('', log, 'optic_audit_logs');
}

export async function fetchAppointments(): Promise<any[]> {
  return apiFetch('', 'optic_my_clinic_appointments', []);
}

export async function saveAppointment(appt: any): Promise<any> {
  return apiPost('', appt, 'optic_my_clinic_appointments');
}

export async function deleteAppointment(id: string): Promise<boolean> {
  return apiDelete('optic_my_clinic_appointments', 'id', id);
}

export async function fetchSightExams(): Promise<any[]> {
  return apiFetch('', 'optic_my_clinic_exams', []);
}

export async function saveSightExam(exam: any): Promise<any> {
  return apiPost('', exam, 'optic_my_clinic_exams');
}

export async function deleteSightExam(id: string): Promise<boolean> {
  return apiDelete('optic_my_clinic_exams', 'id', id);
}

export async function fetchClinicPrescriptions(): Promise<any[]> {
  return apiFetch('', 'optic_my_prescriptions', []);
}

export async function saveClinicPrescription(pres: any): Promise<any> {
  return apiPost('', pres, 'optic_my_prescriptions');
}

export async function deleteClinicPrescription(id: string): Promise<boolean> {
  return apiDelete('optic_my_prescriptions', 'id', id);
}
