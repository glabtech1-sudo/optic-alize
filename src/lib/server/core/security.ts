import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { readStorage, writeStorage } from './database';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'optic-alize-super-secure-access-secret-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'optic-alize-super-secure-refresh-secret-key-2026';

// Persistent Access Token Blacklist
export function blacklistAccessToken(token: string, expiresAt: number): void {
  const blacklist = readStorage<Record<string, number>>('blacklisted_access_tokens', {});
  blacklist[token] = expiresAt;
  
  // Cleanup expired blacklisted tokens
  const now = Date.now();
  for (const t of Object.keys(blacklist)) {
    if (blacklist[t] < now) {
      delete blacklist[t];
    }
  }
  writeStorage('blacklisted_access_tokens', blacklist);
}

export function isAccessTokenBlacklisted(token: string): boolean {
  const blacklist = readStorage<Record<string, number>>('blacklisted_access_tokens', {});
  const expiresAt = blacklist[token];
  if (!expiresAt) return false;
  if (expiresAt < Date.now()) {
    return false;
  }
  return true;
}

// Password Hash utilities
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12); // Strong enterprise work factor
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Token Generation
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
    { expiresIn: '15m' } // 15-minute standard expiration
  );
}

export interface RefreshTokenSession {
  token: string;
  userId: string;
  email: string;
  ip: string;
  userAgent: string;
  issuedAt: number;
  expiresAt: number;
}

export function generateRefreshToken(user: any, ip: string = '127.0.0.1', userAgent: string = 'Unknown'): string {
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7 days standard expiration
  );

  const activeTokens = readStorage<RefreshTokenSession[]>('active_refresh_tokens', []);
  activeTokens.push({
    token,
    userId: user.id,
    email: user.email,
    ip,
    userAgent,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 3600000
  });
  
  writeStorage('active_refresh_tokens', activeTokens);
  return token;
}

export function verifyAccessToken(token: string): any {
  if (isAccessTokenBlacklisted(token)) {
    throw new Error('Token has been revoked');
  }
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): any {
  const activeTokens = readStorage<RefreshTokenSession[]>('active_refresh_tokens', []);
  const session = activeTokens.find(t => t.token === token);
  if (!session) {
    throw new Error('Refresh token is invalid or has been revoked');
  }
  if (Date.now() > session.expiresAt) {
    revokeRefreshToken(token);
    throw new Error('Refresh token has expired');
  }
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

export function rotateRefreshToken(oldToken: string, user: any, ip: string, userAgent: string): string {
  revokeRefreshToken(oldToken);
  return generateRefreshToken(user, ip, userAgent);
}

export function revokeRefreshToken(token: string): boolean {
  const activeTokens = readStorage<RefreshTokenSession[]>('active_refresh_tokens', []);
  const initialLength = activeTokens.length;
  const filtered = activeTokens.filter(t => t.token !== token);
  writeStorage('active_refresh_tokens', filtered);
  return filtered.length < initialLength;
}

// MFA Utilities with full persistent states
export function generateMFAPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface PendingMFASession {
  sessionId: string;
  userId: string;
  mfaSecret: string;
  email: string;
  userObj: any;
  expiresAt: number;
}

export function createPendingMFASession(user: any, secretPin: string): string {
  const sessionId = 'mfa_sess_' + Math.random().toString(36).substring(2, 15);
  const mfaSessions = readStorage<PendingMFASession[]>('pending_mfa_sessions', []);
  
  mfaSessions.push({
    sessionId,
    userId: user.id,
    mfaSecret: secretPin,
    email: user.email,
    userObj: user,
    expiresAt: Date.now() + 5 * 60000 // Valid for 5 minutes
  });

  writeStorage('pending_mfa_sessions', mfaSessions);
  return sessionId;
}

export function verifyPendingMFAPin(sessionId: string, pin: string): any | null {
  const mfaSessions = readStorage<PendingMFASession[]>('pending_mfa_sessions', []);
  const sessionIndex = mfaSessions.findIndex(s => s.sessionId === sessionId);
  
  if (sessionIndex === -1) return null;
  const session = mfaSessions[sessionIndex];
  
  // Remove expired or validated session
  mfaSessions.splice(sessionIndex, 1);
  writeStorage('pending_mfa_sessions', mfaSessions);

  if (Date.now() > session.expiresAt) {
    return null;
  }

  if (session.mfaSecret === pin) {
    return session.userObj;
  }

  return null;
}
