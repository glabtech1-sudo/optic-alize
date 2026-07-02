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
  try {
    const res = await authorizedFetch(url);
    if (res.ok && hasJsonHeader(res)) {
      const data = await res.json();
      localStorage.setItem(fallbackKey, JSON.stringify(data));
      return data as T;
    }
  } catch (e) {
    console.warn(`[API] Failed to fetch ${url}. Using local fallback.`, e);
  }

  // Fallback to local storage
  const saved = localStorage.getItem(fallbackKey);
  if (saved) {
    try {
      return JSON.parse(saved) as T;
    } catch (e) {}
  }
  return defaultVal;
}

async function apiPost<T>(url: string, body: any, fallbackKey: string): Promise<T | null> {
  try {
    const res = await authorizedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok && hasJsonHeader(res)) {
      const savedItem = await res.json();
      // Trigger local storage sync as well
      const saved = localStorage.getItem(fallbackKey);
      if (saved) {
        try {
          const arr = JSON.parse(saved);
          if (Array.isArray(arr)) {
            const idx = arr.findIndex((item: any) => item.id === body.id || item.email === body.email);
            if (idx > -1) {
              arr[idx] = savedItem;
            } else {
              arr.push(savedItem);
            }
            localStorage.setItem(fallbackKey, JSON.stringify(arr));
          }
        } catch (e) {}
      }
      return savedItem as T;
    } else {
      console.warn('[API] POST failed or returned non-JSON. Saving directly to local storage fallback.');
    }
  } catch (e) {
    console.warn(`[API] Failed to POST to ${url}. Saved to local state.`, e);
  }

  // Local fallback write
  const saved = localStorage.getItem(fallbackKey);
  if (saved) {
    try {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        const idx = arr.findIndex((item: any) => item.id === body.id || item.email === body.email);
        if (idx > -1) {
          arr[idx] = body;
        } else {
          arr.push(body);
        }
        localStorage.setItem(fallbackKey, JSON.stringify(arr));
      }
    } catch (e) {}
  } else {
    localStorage.setItem(fallbackKey, JSON.stringify([body]));
  }
  return body as T;
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
  try {
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
  } catch (err: any) {
    console.warn('[API] Server login failed or unreachable. Falling back to local auth.', err);
  }

  // --- LOCAL FALLBACK AUTHENTICATION ---
  const defaults = [
    { id: 'USR-01', name: 'Administrateur Optic Alizé', email: 'glabtech1@opticalize.com', role: 'Admin', status: 'Active', phone: '+221 77 124 55 93', location: 'Optic Alizé Dépôt Central', lastActive: 'Just now', allowedBoutiques: ['Optic Alizé - Dépôt Central'], allowedModules: ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'sav', 'hr'], password: 'Gildas@00741' },
    { id: 'USR-GILDAS', name: 'Gildas Concepteur', email: 'anges.gildas@opticalizé.com', role: 'Admin', status: 'Active', phone: '+221 77 124 55 93', location: 'Optic Alizé - Dépôt Central', lastActive: 'Just now', allowedBoutiques: ['Optic Alizé - Dépôt Central'], allowedModules: ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'sav', 'hr'], password: 'Gildas@00741' },
    { id: 'USR-GILDAS-ALT', name: 'Gildas Concepteur Alt', email: 'anges.gildas@opticalize.com', role: 'Admin', status: 'Active', phone: '+221 77 124 55 93', location: 'Optic Alizé - Dépôt Central', lastActive: 'Just now', allowedBoutiques: ['Optic Alizé - Dépôt Central'], allowedModules: ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'sav', 'hr'], password: 'Gildas@00741' }
  ];

  let storedUsers = defaults;
  const saved = localStorage.getItem('optic_users');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        storedUsers = parsed;
      }
    } catch (e) {}
  }

  const user = storedUsers.find(
    (u) => u.email?.toLowerCase().trim() === email.toLowerCase().trim()
  );

  if (user) {
    if (user.password === password) {
      const simulatedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        allowedModules: user.allowedModules || [],
        mfaEnabled: false
      };
      const fakeToken = 'simulated-local-jwt-token';
      setTokens(fakeToken, fakeToken);
      localStorage.setItem('optic_user_profile', JSON.stringify(simulatedUser));
      return {
        accessToken: fakeToken,
        refreshToken: fakeToken,
        user: simulatedUser
      };
    } else {
      return { error: 'Mot de passe incorrect.' };
    }
  }
  return { error: 'Utilisateur non trouvé.' };
}

export async function verifyMFA(sessionId: string, code: string): Promise<AuthResponse> {
  try {
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
  } catch (err: any) {
    console.warn('[API] verifyMFA error. Falling back.', err);
  }
  return { error: 'Erreur de vérification MFA.' };
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
  try {
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
  } catch (e) {
    console.error('[API] MFA Setup failed:', e);
  }

  // Local fallback
  const profile = localStorage.getItem('optic_user_profile');
  if (profile) {
    try {
      const u = JSON.parse(profile);
      u.mfaEnabled = enabled;
      localStorage.setItem('optic_user_profile', JSON.stringify(u));
    } catch (e) {}
  }
  return { success: true };
}

export async function fetchUserProfile(): Promise<any> {
  try {
    const res = await authorizedFetch('/api/auth/profile');
    if (res.ok && hasJsonHeader(res)) {
      const data = await res.json();
      return data.user;
    }
  } catch (e) {}

  // Local fallback
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
  return apiFetch('/api/companies', 'optic_hq_companies', [
    { id: 'TG', name: 'G-LAB Optic', currency: 'XOF', taxRate: 18, symbol: 'FCFA' },
    { id: 'BJ', name: 'Optic Alizé Bénin', currency: 'XOF', taxRate: 18, symbol: 'FCFA' }
  ]);
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
  try {
    const res = await authorizedFetch(`/api/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
    if (res.ok && hasJsonHeader(res)) {
      const saved = localStorage.getItem('optic_users');
      if (saved) {
        try {
          const arr = JSON.parse(saved);
          if (Array.isArray(arr)) {
            const filtered = arr.filter((u: any) => u.email !== email);
            localStorage.setItem('optic_users', JSON.stringify(filtered));
          }
        } catch (e) {}
      }
      return true;
    }
  } catch (e) {
    console.warn('[API] Delete user failed:', e);
  }

  // Local fallback
  const saved = localStorage.getItem('optic_users');
  if (saved) {
    try {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        const filtered = arr.filter((u: any) => u.email !== email);
        localStorage.setItem('optic_users', JSON.stringify(filtered));
      }
    } catch (e) {}
  }
  return true;
}

export async function fetchCustomers(): Promise<any[]> {
  return apiFetch('/api/customers', 'optic_crm_customers', []);
}

export async function saveCustomer(customer: any): Promise<any> {
  return apiPost('/api/customers', customer, 'optic_crm_customers');
}

export async function fetchProducts(): Promise<any[]> {
  return apiFetch('/api/products', 'optic_fused_catalog', []);
}

export async function saveProduct(product: any): Promise<any> {
  return apiPost('/api/products', product, 'optic_fused_catalog');
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
