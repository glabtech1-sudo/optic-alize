import { readStorage, writeStorage } from './database';

interface FailedAttemptRecord {
  count: number;
  lastAttempt: number;
  lockoutUntil: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60000; // 15 minutes
const WINDOW_DURATION_MS = 10 * 60000; // 10 minutes failed attempts memory window

function getAttemptKey(ip: string, email: string): { ipKey: string; emailKey: string } {
  return {
    ipKey: `ip_${ip.replace(/[^a-zA-Z0-9]/g, '_')}`,
    emailKey: `email_${email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_')}`
  };
}

export function checkBruteForceLockout(ip: string, email: string): { isLocked: boolean; reason?: string; timeLeftSeconds?: number } {
  const attempts = readStorage<Record<string, FailedAttemptRecord>>('bruteforce_attempts', {});
  const { ipKey, emailKey } = getAttemptKey(ip, email);
  const now = Date.now();

  // Check IP Lockout
  const ipRecord = attempts[ipKey];
  if (ipRecord && ipRecord.lockoutUntil > now) {
    const timeLeft = Math.ceil((ipRecord.lockoutUntil - now) / 1000);
    return { isLocked: true, reason: `Adresse IP bloquée temporairement pour cause de tentatives de connexions suspectes répétées.`, timeLeftSeconds: timeLeft };
  }

  // Check Email Lockout
  const emailRecord = attempts[emailKey];
  if (emailRecord && emailRecord.lockoutUntil > now) {
    const timeLeft = Math.ceil((emailRecord.lockoutUntil - now) / 1000);
    return { isLocked: true, reason: `Ce compte de collaborateur a été temporairement verrouillé pour des raisons de sécurité.`, timeLeftSeconds: timeLeft };
  }

  return { isLocked: false };
}

export function registerFailedAttempt(ip: string, email: string): void {
  const attempts = readStorage<Record<string, FailedAttemptRecord>>('bruteforce_attempts', {});
  const { ipKey, emailKey } = getAttemptKey(ip, email);
  const now = Date.now();

  // Update IP Record
  const ipRecord = attempts[ipKey] || { count: 0, lastAttempt: now, lockoutUntil: 0 };
  if (now - ipRecord.lastAttempt > WINDOW_DURATION_MS) {
    ipRecord.count = 1;
  } else {
    ipRecord.count += 1;
  }
  ipRecord.lastAttempt = now;
  if (ipRecord.count >= MAX_FAILED_ATTEMPTS) {
    ipRecord.lockoutUntil = now + LOCKOUT_DURATION_MS;
    console.warn(`[SECURITY WARN] Brute-force IP Lockout triggered for IP: ${ip}`);
  }
  attempts[ipKey] = ipRecord;

  // Update Email Record
  const emailRecord = attempts[emailKey] || { count: 0, lastAttempt: now, lockoutUntil: 0 };
  if (now - emailRecord.lastAttempt > WINDOW_DURATION_MS) {
    emailRecord.count = 1;
  } else {
    emailRecord.count += 1;
  }
  emailRecord.lastAttempt = now;
  if (emailRecord.count >= MAX_FAILED_ATTEMPTS) {
    emailRecord.lockoutUntil = now + LOCKOUT_DURATION_MS;
    console.warn(`[SECURITY WARN] Brute-force Email Lockout triggered for Email: ${email}`);
  }
  attempts[emailKey] = emailRecord;

  writeStorage('bruteforce_attempts', attempts);
}

export function resetFailedAttempts(ip: string, email: string): void {
  const attempts = readStorage<Record<string, FailedAttemptRecord>>('bruteforce_attempts', {});
  const { ipKey, emailKey } = getAttemptKey(ip, email);

  delete attempts[ipKey];
  delete attempts[emailKey];

  writeStorage('bruteforce_attempts', attempts);
}
