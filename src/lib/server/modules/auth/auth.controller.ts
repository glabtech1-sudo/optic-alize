import { Router, Request, Response } from 'express';
import { dbGetUsers, dbUpsertUser, dbDeleteUser } from '../../../db';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  generateMFAPin,
  createPendingMFASession,
  verifyPendingMFAPin
} from '../../core/security';
import { checkBruteForceLockout, registerFailedAttempt, resetFailedAttempts } from '../../core/bruteforce';
import { validateBody, loginSchema } from '../../core/validator';
import { authenticateToken, AuthenticatedRequest } from '../../core/tenant';

const router = Router();

// Endpoint d'inscription / création d'un utilisateur
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, role, phone, location, allowedModules, allowedBoutiques } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Le nom, l\'email et le mot de passe sont requis.' });
  }

  try {
    const existingUsers = await dbGetUsers();
    const duplicate = existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (duplicate) {
      return res.status(400).json({ error: 'Un collaborateur avec cette adresse email existe déjà.' });
    }

    const hp = await hashPassword(password);
    const newUser = await dbUpsertUser({
      name,
      email: email.toLowerCase(),
      password: hp,
      role: role || 'Optician',
      phone: phone || '',
      location: location || '',
      status: 'Active',
      allowedModules: allowedModules || ['dashboard', 'orders', 'crm', 'stock'],
      allowedBoutiques: allowedBoutiques || []
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint de connexion avec protection Brute-Force intégrée
router.post('/login', validateBody(loginSchema) as any, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ip = req.ip || '127.0.0.1';

  // 1. Check Brute-force block
  const lockoutStatus = checkBruteForceLockout(ip, email);
  if (lockoutStatus.isLocked) {
    return res.status(423).json({
      error: lockoutStatus.reason,
      retryAfterSeconds: lockoutStatus.timeLeftSeconds
    });
  }

  try {
    const users = await dbGetUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    // Gérer la compatibilité du Super Admin bypass si non existant
    if (!user && (email.toLowerCase().trim() === 'glabtech1@opticalize.com' || email.toLowerCase().trim() === 'glabtech1@gmail.com')) {
      const hp = await hashPassword('Gildas@00741');
      user = await dbUpsertUser({
        id: 'USR-ADMIN-1',
        name: 'Glabtech1 Super Admin',
        email: email.toLowerCase().trim(),
        password: hp,
        role: 'Admin',
        status: 'Active',
        phone: '+221 77 124 55 93',
        location: 'Optic Alizé - Dépôt Central',
        allowedBoutiques: ['BOU-01'],
        allowedModules: ['dashboard', 'orders', 'crm', 'accounting', 'hr', 'stock', 'sav', 'settings']
      });
    }

    if (!user) {
      registerFailedAttempt(ip, email);
      return res.status(401).json({ error: 'Identifiants incorrects. Aucun collaborateur trouvé.' });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ error: 'Votre compte a été suspendu par l\'administration.' });
    }

    // 2. Valider le mot de passe hashé
    const isMatch = await comparePassword(password, user.password || '');
    if (!isMatch) {
      registerFailedAttempt(ip, email);
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    // Clear failed logins upon successful login
    resetFailedAttempts(ip, email);

    // 3. MFA optionnelle
    if (user.mfaEnabled) {
      const mfaPin = generateMFAPin();
      const sessionId = createPendingMFASession(user, mfaPin);
      console.log(`\n======================================================`);
      console.log(`[MFA ENFORCEMENT] Code OTP généré pour ${user.email} : ${mfaPin}`);
      console.log(`======================================================\n`);
      return res.json({
        mfaRequired: true,
        sessionId,
        mfaPin, // Renvoyé pour faciliter l'UX de test dans la sandbox !
        message: 'Code de sécurité MFA requis.'
      });
    }

    // 4. Génération directe des tokens JWT
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, ip, req.headers['user-agent'] as string);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roleId ? (user.role?.name || 'Optician') : (user.role || 'Optician'),
        allowedModules: user.allowedModules,
        mfaEnabled: user.mfaEnabled
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Validation du code OTP MFA
router.post('/mfa/verify', async (req: Request, res: Response) => {
  const { sessionId, code } = req.body;
  if (!sessionId || !code) {
    return res.status(400).json({ error: 'L\'identifiant de session et le code OTP sont requis.' });
  }

  try {
    const user = verifyPendingMFAPin(sessionId, code);
    if (!user) {
      return res.status(401).json({ error: 'Code MFA invalide ou expiré.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, req.ip, req.headers['user-agent'] as string);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roleId ? (user.role?.name || 'Optician') : (user.role || 'Optician'),
        allowedModules: user.allowedModules,
        mfaEnabled: user.mfaEnabled
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Rafraîchir l'Access Token avec un Refresh Token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Le jeton de rafraîchissement (refresh token) est requis.' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const users = await dbGetUsers();
    const user = users.find(u => u.email.toLowerCase() === decoded.email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable.' });
    }

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err: any) {
    res.status(401).json({ error: 'Refresh token invalide ou expiré.' });
  }
});

// Déconnexion et révocation du Refresh Token
router.post('/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    revokeRefreshToken(refreshToken);
  }
  res.json({ success: true, message: 'Déconnecté avec succès.' });
});

// Activation / Désactivation optionnelle du MFA
router.post('/mfa/setup', authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  const { enabled } = req.body;
  if (enabled === undefined) {
    return res.status(400).json({ error: 'Le champ "enabled" est requis.' });
  }

  try {
    const users = await dbGetUsers();
    const user = users.find(u => u.email.toLowerCase() === req.user?.email.toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const mfaSecret = enabled ? generateMFAPin() : null;
    user.mfaEnabled = enabled;
    user.mfaSecret = mfaSecret;

    await dbUpsertUser(user);

    res.json({
      success: true,
      mfaEnabled: enabled,
      mfaSecret,
      message: enabled ? 'MFA activé avec succès.' : 'MFA désactivé avec succès.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Route sécurisée d'obtention du profil
router.get('/profile', authenticateToken as any, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
