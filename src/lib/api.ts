// Frontend API Client for Real-time PostgreSQL & Prisma database synchronization
// Integrated with JWT Access Tokens, Refresh Tokens, Auto-Retry on expiry, and Offline-First LocalStorage Fallbacks

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

// Global Refresh Token lock to avoid redundant refresh calls
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function hasJsonHeader(res: Response): boolean {
  const contentType = res.headers.get('content-type');
  return !!(contentType && contentType.includes('application/json'));
}

async function tryRefresh(): Promise<string | null> {
  const rfToken = getRefreshToken();
  if (!rfToken) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rfToken })
    });
    if (res.ok && hasJsonHeader(res)) {
      const data = await res.json();
      if (data.accessToken) {
        localStorage.setItem('optic_access_token', data.accessToken);
        return data.accessToken;
      }
    }
  } catch (err) {
    console.error('[API] Failed to refresh token:', err);
  }
  return null;
}

// Main fetch wrapper with authorization injection and auto-refresh retry
async function authorizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  options.headers = headers;

  let response = await fetch(url, options);

  // If unauthorized / token expired (401 or 403), trigger automatic token refresh
  if ((response.status === 401 || response.status === 403) && getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefresh();
      isRefreshing = false;
      
      if (newToken) {
        // Execute queued requests with the new token
        refreshQueue.forEach(callback => callback(newToken));
        refreshQueue = [];
        
        // Retry the original failed request with the new token
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        options.headers = retryHeaders;
        return fetch(url, options);
      } else {
        // Refresh token invalid, clear session
        clearTokens();
        // Dispatch custom event to let the React app know we need to force logout
        window.dispatchEvent(new Event('optic-unauthorized'));
      }
    } else {
      // Wait for the active refresh to complete
      return new Promise<Response>((resolve) => {
        refreshQueue.push((newToken) => {
          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          options.headers = retryHeaders;
          resolve(fetch(url, options));
        });
      });
    }
  }

  return response;
}

async function apiFetch<T>(url: string, fallbackKey: string, defaultVal: T): Promise<T> {
  const res = await authorizedFetch(url);
  if (res.ok && hasJsonHeader(res)) {
    return await res.json() as T;
  }
  throw new Error(`[API] Fetch failed for ${url}: ${res.statusText}`);
}

async function apiPost<T>(url: string, body: any, fallbackKey: string): Promise<T | null> {
  const res = await authorizedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (res.ok && hasJsonHeader(res)) {
    return await res.json() as T;
  }
  throw new Error(`[API] POST failed for ${url}: ${res.statusText}`);
}

// --- CORE AUTHENTICATION API CALLS ---

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

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (res.ok && hasJsonHeader(res)) {
    const data = await res.json();
    if (data.accessToken && data.refreshToken) {
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('optic_user_profile', JSON.stringify(data.user));
    }
    return data;
  }
  const errorText = 'Identifiants invalides ou service indisponible';
  try {
    const errData = await res.json();
    return { error: errData.error || errorText };
  } catch (e) {
    return { error: errorText };
  }
}

export async function verifyMFA(sessionId: string, code: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, code })
  });
  if (res.ok && hasJsonHeader(res)) {
    const data = await res.json();
    if (data.accessToken && data.refreshToken) {
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('optic_user_profile', JSON.stringify(data.user));
    }
    return data;
  }
  return { error: 'Code MFA incorrect.' };
}

export async function logoutUser(): Promise<void> {
  const rfToken = getRefreshToken();
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rfToken })
    });
  } catch (e) {}
  clearTokens();
}

export async function setupUserMFA(enabled: boolean): Promise<any> {
  const res = await authorizedFetch('/api/auth/mfa/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (res.ok && hasJsonHeader(res)) {
    const data = await res.json();
    const profile = localStorage.getItem('optic_user_profile');
    if (profile) {
      const u = JSON.parse(profile);
      u.mfaEnabled = enabled;
      localStorage.setItem('optic_user_profile', JSON.stringify(u));
    }
    return data;
  }
  throw new Error('[API] MFA Setup failed');
}

export async function fetchUserProfile(): Promise<any> {
  const res = await authorizedFetch('/api/auth/profile');
  if (res.ok && hasJsonHeader(res)) {
    const data = await res.json();
    return data.user;
  }
  const profile = localStorage.getItem('optic_user_profile');
  if (profile) {
    try {
      return JSON.parse(profile);
    } catch (e) {}
  }
  return null;
}

// --- STANDARD ERP SYNC APIS ---

export async function fetchCompanies(): Promise<any[]> {
  return apiFetch('/api/companies', 'optic_hq_companies', []);
}

export async function saveCompany(company: any): Promise<any> {
  return apiPost('/api/companies', company, 'optic_hq_companies');
}

export async function fetchBranches(): Promise<any[]> {
  return apiFetch('/api/branches', 'optic_hq_branches', []);
}

export async function saveBranch(branch: any): Promise<any> {
  return apiPost('/api/branches', branch, 'optic_hq_branches');
}

export async function fetchUsers(): Promise<any[]> {
  return apiFetch('/api/users', 'optic_users', []);
}

export async function saveUser(user: any): Promise<any> {
  return apiPost('/api/users', user, 'optic_users');
}

export async function deleteUser(email: string): Promise<boolean> {
  const res = await authorizedFetch(`/api/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
  if (res.ok) {
    return true;
  }
  throw new Error('Delete user failed');
}

export async function fetchCustomers(): Promise<any[]> {
  return apiFetch('/api/customers', 'optic_crm_customers', []);
}

export async function saveCustomer(customer: any): Promise<any> {
  return apiPost('/api/customers', customer, 'optic_crm_customers');
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const res = await authorizedFetch(`/api/customers/${id}`, {
    method: 'DELETE'
  });
  if (res.ok) {
    return true;
  }
  throw new Error('Delete customer failed');
}

export async function fetchProducts(): Promise<any[]> {
  return apiFetch('/api/products', 'optic_fused_catalog', []);
}

export async function saveProduct(product: any): Promise<any> {
  return apiPost('/api/products', product, 'optic_fused_catalog');
}

export async function deleteProduct(id: string): Promise<boolean> {
  const res = await authorizedFetch(`/api/products/${id}`, {
    method: 'DELETE'
  });
  if (res.ok) {
    return true;
  }
  throw new Error('Delete product failed');
}

export async function fetchInvoices(): Promise<any[]> {
  return apiFetch('/api/invoices', 'optic_saas_orders', []);
}

export async function saveInvoice(invoice: any): Promise<any> {
  return apiPost('/api/invoices', invoice, 'optic_saas_orders');
}

export async function fetchAuditLogs(): Promise<any[]> {
  return apiFetch('/api/audit_logs', 'optic_audit_logs', []);
}

export async function saveAuditLog(log: any): Promise<any> {
  return apiPost('/api/audit_logs', log, 'optic_audit_logs');
}

export async function fetchAppointments(): Promise<any[]> {
  return apiFetch('/api/clinic/appointments', 'optic_my_clinic_appointments', []);
}

export async function saveAppointment(appt: any): Promise<any> {
  return apiPost('/api/clinic/appointments', appt, 'optic_my_clinic_appointments');
}

export async function deleteAppointment(id: string): Promise<boolean> {
  const res = await authorizedFetch(`/api/clinic/appointments/${id}`, {
    method: 'DELETE'
  });
  if (res.ok) return true;
  throw new Error('Delete appointment failed');
}

export async function fetchSightExams(): Promise<any[]> {
  return apiFetch('/api/clinic/exams', 'optic_my_clinic_exams', []);
}

export async function saveSightExam(exam: any): Promise<any> {
  return apiPost('/api/clinic/exams', exam, 'optic_my_clinic_exams');
}

export async function deleteSightExam(id: string): Promise<boolean> {
  const res = await authorizedFetch(`/api/clinic/exams/${id}`, {
    method: 'DELETE'
  });
  if (res.ok) return true;
  throw new Error('Delete sight exam failed');
}

export async function fetchClinicPrescriptions(): Promise<any[]> {
  return apiFetch('/api/clinic/prescriptions', 'optic_my_prescriptions', []);
}

export async function saveClinicPrescription(pres: any): Promise<any> {
  return apiPost('/api/clinic/prescriptions', pres, 'optic_my_prescriptions');
}

export async function deleteClinicPrescription(id: string): Promise<boolean> {
  const res = await authorizedFetch(`/api/clinic/prescriptions/${id}`, {
    method: 'DELETE'
  });
  if (res.ok) return true;
  throw new Error('Delete clinic prescription failed');
}
