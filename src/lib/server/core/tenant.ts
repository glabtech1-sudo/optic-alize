import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './security';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': [
    'read:dashboard',
    'read:companies',
    'write:companies',
    'read:branches',
    'write:branches',
    'read:users',
    'write:users',
    'delete:users',
    'read:customers',
    'write:customers',
    'read:products',
    'write:products',
    'read:invoices',
    'write:invoices',
    'read:audit_logs',
    'write:audit_logs',
    'read:stock',
    'write:stock',
    'read:clinical',
    'write:clinical',
    'read:accounting'
  ],
  'Admin': [
    'read:dashboard',
    'read:companies',
    'write:companies',
    'read:branches',
    'write:branches',
    'read:users',
    'write:users',
    'delete:users',
    'read:customers',
    'write:customers',
    'read:products',
    'write:products',
    'read:invoices',
    'write:invoices',
    'read:audit_logs',
    'write:audit_logs',
    'read:stock',
    'write:stock',
    'read:clinical',
    'write:clinical',
    'read:accounting'
  ],
  'Directeur': [
    'read:dashboard',
    'read:branches',
    'write:branches',
    'read:users',
    'write:users',
    'delete:users',
    'read:customers',
    'write:customers',
    'read:products',
    'write:products',
    'read:invoices',
    'write:invoices',
    'read:audit_logs',
    'read:stock',
    'write:stock',
    'read:clinical',
    'write:clinical',
    'read:accounting'
  ],
  'Concepteur': [
    'read:dashboard',
    'read:companies',
    'write:companies',
    'read:branches',
    'write:branches',
    'read:users',
    'write:users',
    'delete:users',
    'read:customers',
    'write:customers',
    'read:products',
    'write:products',
    'read:invoices',
    'write:invoices',
    'read:audit_logs',
    'write:audit_logs',
    'read:stock',
    'write:stock',
    'read:clinical',
    'write:clinical',
    'read:accounting'
  ],
  'Manager': [
    'read:dashboard',
    'read:branches',
    'read:users',
    'read:customers',
    'write:customers',
    'read:products',
    'write:products',
    'read:invoices',
    'write:invoices',
    'read:stock',
    'write:stock',
    'read:clinical',
    'write:clinical'
  ],
  'Gérant': [
    'read:dashboard',
    'read:branches',
    'read:users',
    'read:customers',
    'write:customers',
    'read:products',
    'write:products',
    'read:invoices',
    'write:invoices',
    'read:stock',
    'write:stock',
    'read:clinical',
    'write:clinical'
  ],
  'Optician': [
    'read:dashboard',
    'read:customers',
    'write:customers',
    'read:products',
    'read:invoices',
    'write:invoices',
    'read:stock',
    'read:clinical',
    'write:clinical'
  ],
  'Opticien': [
    'read:dashboard',
    'read:customers',
    'write:customers',
    'read:products',
    'read:invoices',
    'write:invoices',
    'read:stock',
    'read:clinical',
    'write:clinical'
  ],
  'Billing Manager': [
    'read:dashboard',
    'read:customers',
    'read:invoices',
    'write:invoices',
    'read:audit_logs'
  ],
  'Comptable': [
    'read:dashboard',
    'read:customers',
    'read:products',
    'read:invoices',
    'read:stock',
    'read:accounting',
    'read:audit_logs'
  ],
  'Cashier': [
    'read:customers',
    'read:products',
    'read:invoices',
    'write:invoices'
  ],
  'Caissier': [
    'read:customers',
    'read:products',
    'read:invoices',
    'write:invoices'
  ],
  'Editor': [
    'read:dashboard',
    'read:companies',
    'write:companies',
    'read:branches',
    'write:branches',
    'read:users',
    'write:users',
    'delete:users',
    'read:customers',
    'write:customers',
    'read:products',
    'write:products',
    'read:invoices',
    'write:invoices',
    'read:audit_logs',
    'write:audit_logs',
    'read:stock',
    'write:stock'
  ],
  'Viewer': [
    'read:dashboard'
  ],
  'Secrétaire': [
    'read:customers',
    'read:clinical',
    'write:clinical'
  ]
};

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    allowedModules: string[];
    allowedBoutiques: string[];
    companyId: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role || 'Optician',
      name: decoded.name || '',
      allowedModules: decoded.allowedModules || [],
      allowedBoutiques: decoded.allowedBoutiques || [],
      companyId: decoded.companyId || 'TG'
    };
    next();
  } catch (err: any) {
    return res.status(403).json({ error: 'Token is invalid or expired', expired: true });
  }
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not authenticated' });
    }

    const userRole = req.user.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      error: `Access Denied: Required permission '${permission}' not granted for role '${userRole}'`
    });
  };
}

// Middleware for strict multi-tenant and branch level isolation
export function enforceTenantIsolation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Access Denied: User authentication required.' });
  }

  const { companyId, role, allowedBoutiques } = req.user;

  // 1. Force companyId injection/restriction on body and query params
  if (req.body) {
    req.body.companyId = companyId;
  }
  if (req.query) {
    req.query.companyId = companyId;
  }

  // 2. Strict Branch/Boutique validation
  const targetBranchId = req.body?.branchId || req.body?.branch || req.body?.boutique || req.query?.branchId || req.query?.branch || req.query?.boutique;
  
  if (targetBranchId) {
    const isGlobalRole = ['Admin', 'Concepteur'].includes(role);
    if (!isGlobalRole) {
      // Validate that restricted users can only access branches they are allowed to
      const hasAccess = allowedBoutiques.includes(targetBranchId);
      if (!hasAccess && allowedBoutiques.length > 0) {
        return res.status(403).json({
          error: `Sécurité Multi-Boutiques : Vous n'êtes pas autorisé à accéder aux données de la boutique '${targetBranchId}'.`
        });
      }
    }
  }

  next();
}
