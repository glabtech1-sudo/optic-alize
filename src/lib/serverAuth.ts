import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { dbGetUsers } from './db';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'optic-alize-super-secure-access-secret-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'optic-alize-super-secure-refresh-secret-key-2026';

// Store revoked refresh tokens and active refresh tokens
const activeRefreshTokens = new Set<string>();
const blacklistedAccessTokens = new Set<string>();

// Role permission mappings for standard SaaS users
// High granularity: can view dashboard, edit orders, edit CRM, edit HR, edit Stock, edit SAV, edit Settings
export const ROLE_PERMISSIONS: Record<string, string[]> = {
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
    'write:stock'
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
    'write:stock'
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
    'write:stock'
  ],
  'Optician': [
    'read:dashboard',
    'read:customers',
    'write:customers',
    'read:products',
    'read:invoices',
    'write:invoices',
    'read:stock'
  ],
  'Billing Manager': [
    'read:dashboard',
    'read:customers',
    'read:invoices',
    'write:invoices',
    'read:audit_logs'
  ],
  'Cashier': [
    'read:customers',
    'read:products',
    'read:invoices',
    'write:invoices'
  ]
};

// Express Request typings override helper
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

// 1. Password Hash using bcryptjs
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 2. Token Generation & Management
export function generateAccessToken(user: any): string {
  const companyId = user.companyId || 'TG';
  const roleName = user.roleId ? (user.role?.name || user.role || 'Optician') : (user.role || 'Optician');
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: roleName,
      name: user.name,
      allowedModules: user.allowedModules || [],
      allowedBoutiques: user.allowedBoutiques || [],
      companyId: companyId
    },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' } // 15 minutes expiration
  );
}

export function generateRefreshToken(user: { id: string; email: string; role: string }): string {
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7 days expiration
  );
  activeRefreshTokens.add(token);
  return token;
}

export function verifyAccessToken(token: string): any {
  if (blacklistedAccessTokens.has(token)) {
    throw new Error('Token has been revoked');
  }
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): any {
  if (!activeRefreshTokens.has(token)) {
    throw new Error('Refresh token is invalid or has been revoked');
  }
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

export function revokeRefreshToken(token: string): boolean {
  return activeRefreshTokens.delete(token);
}

export function revokeAccessToken(token: string): void {
  blacklistedAccessTokens.add(token);
}

// 3. MFA Utilities (Optional mobile-simulated MFA with 6-digit dynamic codes)
export function generateMFAPin(): string {
  // Simple highly reliable 6-digit OTP code generator
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory store for pending MFA verifications
const pendingMFASessions = new Map<string, { userId: string; mfaSecret: string; email: string; userObj: any; expiresAt: number }>();

export function createPendingMFASession(user: any, secretPin: string) {
  const sessionId = 'mfa_sess_' + Math.random().toString(36).substring(2, 15);
  pendingMFASessions.set(sessionId, {
    userId: user.id,
    mfaSecret: secretPin,
    email: user.email,
    userObj: user,
    expiresAt: Date.now() + 5 * 60000 // Valid for 5 minutes
  });
  return sessionId;
}

export function verifyPendingMFAPin(sessionId: string, pin: string): any | null {
  const session = pendingMFASessions.get(sessionId);
  if (!session) return null;
  
  if (Date.now() > session.expiresAt) {
    pendingMFASessions.delete(sessionId);
    return null;
  }

  if (session.mfaSecret === pin) {
    pendingMFASessions.delete(sessionId);
    return session.userObj;
  }

  return null;
}

// 4. Server-side Authentication Middleware
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

// 5. Server-side RBAC authorization middleware (Complete Permission enforcement)
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
