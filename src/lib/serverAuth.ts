import { Request, Response, NextFunction } from 'express';
import {
  hashPassword as coreHashPassword,
  comparePassword as coreComparePassword,
  generateAccessToken as coreGenerateAccessToken,
  generateRefreshToken as coreGenerateRefreshToken,
  verifyRefreshToken as coreVerifyRefreshToken,
  revokeRefreshToken as coreRevokeRefreshToken,
  generateMFAPin as coreGenerateMFAPin,
  createPendingMFASession as coreCreatePendingMFASession,
  verifyPendingMFAPin as coreVerifyPendingMFAPin
} from './server/core/security';
import {
  authenticateToken as coreAuthenticateToken,
  requirePermission as coreRequirePermission,
  ROLE_PERMISSIONS as coreROLE_PERMISSIONS,
  AuthenticatedRequest as CoreAuthenticatedRequest
} from './server/core/tenant';

export const ROLE_PERMISSIONS = coreROLE_PERMISSIONS;

export interface AuthenticatedRequest extends CoreAuthenticatedRequest {}

export async function hashPassword(password: string): Promise<string> {
  return coreHashPassword(password);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return coreComparePassword(password, hash);
}

export function generateAccessToken(user: any): string {
  return coreGenerateAccessToken(user);
}

export function generateRefreshToken(user: { id: string; email: string; role: string }): string {
  return coreGenerateRefreshToken(user);
}

export function verifyRefreshToken(token: string): any {
  return coreVerifyRefreshToken(token);
}

export function revokeRefreshToken(token: string): boolean {
  return coreRevokeRefreshToken(token);
}

export function generateMFAPin(): string {
  return coreGenerateMFAPin();
}

export function createPendingMFASession(user: any, secretPin: string) {
  return coreCreatePendingMFASession(user, secretPin);
}

export function verifyPendingMFAPin(sessionId: string, pin: string): any | null {
  return coreVerifyPendingMFAPin(sessionId, pin);
}

export function authenticateToken(req: any, res: Response, next: NextFunction) {
  return coreAuthenticateToken(req, res, next);
}

export function requirePermission(permission: string) {
  return coreRequirePermission(permission);
}
