import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import crypto from 'crypto';
import {
  dbGetCompanies,
  dbUpsertCompany,
  dbGetBranches,
  dbUpsertBranch,
  dbGetUsers,
  dbUpsertUser,
  dbDeleteUser,
  dbGetCustomers,
  dbUpsertCustomer,
  dbGetProducts,
  dbUpsertProduct,
  dbGetInvoices,
  dbSaveInvoice,
  dbGetAuditLogs,
  dbSaveAuditLog,
  dbGetSuppliers,
  dbUpsertSupplier,
  dbGetInventory,
  dbUpsertInventory,
  dbGetAccountingSummary,
  dbGetHRCollaborators,
  dbCreateBackup,
  dbGetBackups,
  dbRestoreBackup
} from './src/lib/db';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  generateMFAPin,
  createPendingMFASession,
  verifyPendingMFAPin,
  authenticateToken,
  requirePermission,
  AuthenticatedRequest
} from './src/lib/serverAuth';

dotenv.config();

// Initialiser le client Gemini en respectant STRICTEMENT les consignes du skill
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  // 1. Helmet Security Headers (iframe-friendly configuration)
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
  }));

  // 2. CORS Setup
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // 3. API Rate Limiting (15 mins window, max 500 requests per IP)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, 
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    message: { error: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer après 15 minutes.' }
  });
  app.use('/api/', apiLimiter);

  // Parse JSON payloads early so that sanitization and subsequent middlewares can inspect req.body
  app.use(express.json());

  // 4. XSS Sanitization Middleware
  function sanitizeInput(obj: any): any {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, 'no-javascript:')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '');
    } else if (Array.isArray(obj)) {
      return obj.map(item => sanitizeInput(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        cleaned[key] = sanitizeInput(obj[key]);
      }
      return cleaned;
    }
    return obj;
  }

  app.use((req, res, next) => {
    if (req.body) req.body = sanitizeInput(req.body);
    if (req.query) req.query = sanitizeInput(req.query);
    next();
  });

  // 5. CSRF Protection for stateful actions (Proxy and Cloud Run Sandbox aware)
  app.use((req, res, next) => {
    const hasCookie = req.headers.cookie;
    if (hasCookie && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const origin = req.headers.origin || req.headers.referer;
      const host = req.headers.host;
      if (origin && host) {
        // Allow same-origin, local development, and the platform's Cloud Run sandbox subdomains (.run.app / google.com)
        const isCloudRun = origin.includes('.run.app') || origin.includes('google.com');
        const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isHostMatched = origin.includes(host);
        
        if (!isCloudRun && !isLocal && !isHostMatched) {
          return res.status(403).json({ error: 'CSRF security block: Origin mismatch.' });
        }
      }
    }
    next();
  });

  // 6. Server-Side AES Cryptographic Utilities (Replaces XOR/Base64 home-brewed structures)
  const SERVER_AES_KEY = crypto.scryptSync(process.env.JWT_ACCESS_SECRET || 'OPTICALIZE_SECRET_ACCESS_KEY', 'salt', 32);

  function encryptServerData(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', SERVER_AES_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  function decryptServerData(text: string): string {
    const parts = text.split(':');
    if (parts.length !== 2) return '';
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', SERVER_AES_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  // 7. Zod Request Body Validation Schemas
  const loginSchema = z.object({
    email: z.string().email('Format email invalide'),
    password: z.string().min(4, 'Mot de passe trop court')
  });

  const customerSchema = z.object({
    id: z.string().optional(),
    firstName: z.string().min(1, 'Prénom requis'),
    lastName: z.string().min(1, 'Nom requis'),
    birthDate: z.string(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    branch: z.string().optional()
  });

  const productSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Nom du produit requis'),
    brand: z.string(),
    category: z.string(),
    price: z.number().positive('Le prix doit être positif'),
    barcode: z.string().optional()
  });

  const supplierSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Nom du fournisseur requis'),
    contactName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional()
  });

  const inventorySchema = z.object({
    id: z.string(),
    branchId: z.string(),
    productId: z.string(),
    quantity: z.union([z.number(), z.string()]),
    minStock: z.union([z.number(), z.string()]).optional()
  });

  const invoiceSchema = z.object({
    id: z.string(),
    customerId: z.string().optional().nullable(),
    shop: z.string(),
    total: z.number(),
    items: z.array(z.any()).optional()
  });

  function validateBody(schema: z.ZodSchema) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: 'Échec de validation des données',
          details: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      req.body = result.data;
      next();
    };
  }

  // Helper de migration et de seeding de comptes démo avec hashage bcrypt sécurisé
  async function seedDefaultAuthUsers() {
    try {
      const existingUsers = await dbGetUsers();
      console.log(`[AUTH SEED] Checking ${existingUsers.length} existing users for bcrypt migrations...`);
      
      const adminEmail = 'glabtech1@opticalize.com';
      const adminUser = existingUsers.find(u => u.email.toLowerCase() === adminEmail);
      const hp = await hashPassword('Gildas@00741');
      
      if (!adminUser) {
        await dbUpsertUser({
          id: 'USR-ADMIN-1',
          name: 'Glabtech1 Super Admin',
          email: adminEmail,
          password: hp,
          role: 'Admin',
          status: 'Active',
          phone: '+221 77 124 55 93',
          location: 'Optic Alizé - Dépôt Central',
          allowedBoutiques: ['BOU-01'],
          allowedModules: ['dashboard', 'orders', 'crm', 'accounting', 'hr', 'stock', 'sav', 'settings']
        });
        console.log('[AUTH SEED] Seeded default Super Admin with secure bcrypt password.');
      } else {
        const matches = await comparePassword('Gildas@00741', adminUser.password || '');
        if (!matches || adminUser.role !== 'Admin') {
          await dbUpsertUser({
            ...adminUser,
            role: 'Admin',
            password: hp
          });
          console.log('[AUTH SEED] Reset and repaired password/role for Glabtech1 Super Admin.');
        }
      }

      // Seeding pour anges.gildas@opticalize.com
      const angesEmail = 'anges.gildas@opticalize.com';
      const angesUser = existingUsers.find(u => u.email.toLowerCase() === angesEmail);
      if (!angesUser) {
        await dbUpsertUser({
          id: 'USR-GILDAS-ALT',
          name: 'Gildas Concepteur Alt',
          email: angesEmail,
          password: hp,
          role: 'Concepteur',
          status: 'Active',
          phone: '+221 77 124 55 93',
          location: 'Optic Alizé - Dépôt Central',
          allowedBoutiques: ['BOU-01'],
          allowedModules: ['dashboard', 'orders', 'crm', 'accounting', 'hr', 'stock', 'sav', 'settings', 'fidelisation', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'websockets', 'reports']
        });
        console.log('[AUTH SEED] Seeded default Gildas Alt Super Admin with secure bcrypt password.');
      } else {
        const matches = await comparePassword('Gildas@00741', angesUser.password || '');
        if (!matches || angesUser.role !== 'Concepteur') {
          await dbUpsertUser({
            ...angesUser,
            role: 'Concepteur',
            password: hp
          });
          console.log('[AUTH SEED] Reset and repaired password/role for Gildas Alt.');
        }
      }

      // Seeding pour anges.gildas@opticalizé.com
      const accentedEmail = 'anges.gildas@opticalizé.com';
      const accentedUser = existingUsers.find(u => u.email.toLowerCase() === accentedEmail);
      if (!accentedUser) {
        await dbUpsertUser({
          id: 'USR-GILDAS',
          name: 'Gildas Concepteur',
          email: accentedEmail,
          password: hp,
          role: 'Concepteur',
          status: 'Active',
          phone: '+221 77 124 55 93',
          location: 'Optic Alizé - Dépôt Central',
          allowedBoutiques: ['BOU-01'],
          allowedModules: ['dashboard', 'orders', 'crm', 'accounting', 'hr', 'stock', 'sav', 'settings', 'fidelisation', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'websockets', 'reports']
        });
        console.log('[AUTH SEED] Seeded default Gildas Accented Super Admin with secure bcrypt password.');
      } else {
        const matches = await comparePassword('Gildas@00741', accentedUser.password || '');
        if (!matches || accentedUser.role !== 'Concepteur') {
          await dbUpsertUser({
            ...accentedUser,
            role: 'Concepteur',
            password: hp
          });
          console.log('[AUTH SEED] Reset and repaired password/role for Gildas Accented.');
        }
      }

      // Supprimer tous les autres comptes d'accès conformément à la demande :
      // "supprimer les compte cree dans utilisateurs crm acces comme dans RH sauf glabtech1@opticalize.com et anges.gildas@opticalize.com"
      const permittedEmails = [
        'glabtech1@opticalize.com',
        'anges.gildas@opticalize.com',
        'anges.gildas@opticalizé.com'
      ];
      for (const u of existingUsers) {
        if (u.email && !permittedEmails.includes(u.email.toLowerCase().trim())) {
          await dbDeleteUser(u.email);
          console.log(`[AUTH SEED] Deleted non-permitted user account: ${u.email}`);
        }
      }
    } catch (err) {
      console.error('[AUTH SEED] Error running user seed/migration:', err);
    }
  }

  // Executer le seeding au démarrage
  await seedDefaultAuthUsers();

  // --- API AUTHENTICATION ENDPOINTS (JWT, PASSWORD HASH, MFA, REVOCATION) ---

  // Endpoint d'inscription / création d'un utilisateur
  app.post('/api/auth/register', async (req, res) => {
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

  // Endpoint de connexion
  app.post('/api/auth/login', validateBody(loginSchema) as any, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'L\'email et le mot de passe sont requis.' });
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
        return res.status(401).json({ error: 'Identifiants incorrects. Aucun collaborateur trouvé.' });
      }

      if (user.status === 'Suspended') {
        return res.status(403).json({ error: 'Votre compte a été suspendu par l\'administration.' });
      }

      // Valider le mot de passe hashé
      const isMatch = await comparePassword(password, user.password || '');
      if (!isMatch) {
        return res.status(401).json({ error: 'Mot de passe incorrect.' });
      }

      // MFA optionnelle
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

      // Pas de MFA : génération directe des tokens JWT
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

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
  app.post('/api/auth/mfa/verify', async (req, res) => {
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
      const refreshToken = generateRefreshToken(user);

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
  app.post('/api/auth/refresh', async (req, res) => {
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
  app.post('/api/auth/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      revokeRefreshToken(refreshToken);
    }
    res.json({ success: true, message: 'Déconnecté avec succès.' });
  });

  // Activation / Désactivation optionnelle du MFA pour l'utilisateur connecté
  app.post('/api/auth/mfa/setup', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
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

      // Activer ou désactiver
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

  // Route sécurisée d'obtention du profil utilisateur avec permissions
  app.get('/api/auth/profile', authenticateToken as any, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // 1. API - Endpoint de santé
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- DATABASE SYNC ENDPOINTS (POSTGRESQL & PRISMA COMPATIBLE) ---
  app.get('/api/companies', authenticateToken as any, requirePermission('read:companies') as any, async (req, res) => {
    try {
      const companies = await dbGetCompanies();
      res.json(companies);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/companies', authenticateToken as any, requirePermission('write:companies') as any, async (req, res) => {
    try {
      const company = await dbUpsertCompany(req.body);
      res.json(company);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/branches', authenticateToken as any, requirePermission('read:branches') as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const branches = await dbGetBranches(companyId);
      res.json(branches);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/branches', authenticateToken as any, requirePermission('write:branches') as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const branch = await dbUpsertBranch(req.body, companyId);
      res.json(branch);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users', authenticateToken as any, requirePermission('read:users') as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const users = await dbGetUsers(companyId);
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', authenticateToken as any, requirePermission('write:users') as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const user = await dbUpsertUser(req.body, companyId);
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:email', authenticateToken as any, requirePermission('delete:users') as any, async (req: AuthenticatedRequest, res) => {
    try {
      await dbDeleteUser(req.params.email);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/customers', authenticateToken as any, requirePermission('read:customers') as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const customers = await dbGetCustomers(companyId);
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/customers', authenticateToken as any, requirePermission('write:customers') as any, validateBody(customerSchema) as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const customer = await dbUpsertCustomer(req.body, companyId);
      res.json(customer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/products', authenticateToken as any, requirePermission('read:products') as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const products = await dbGetProducts(companyId);
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', authenticateToken as any, requirePermission('write:products') as any, validateBody(productSchema) as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const product = await dbUpsertProduct(req.body, companyId);
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/invoices', authenticateToken as any, requirePermission('read:invoices') as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const invoices = await dbGetInvoices(companyId);
      res.json(invoices);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/invoices', authenticateToken as any, requirePermission('write:invoices') as any, validateBody(invoiceSchema) as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const invoice = await dbSaveInvoice(req.body, companyId);
      res.json(invoice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/audit_logs', authenticateToken as any, requirePermission('read:audit_logs') as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const logs = await dbGetAuditLogs(companyId);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/audit_logs', authenticateToken as any, requirePermission('write:audit_logs') as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const log = await dbSaveAuditLog(req.body, companyId);
      res.json(log);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- NEW SECURE REST ENDPOINTS FOR ACHATS, STOCK, RH, COMPTABILITÉ ---

  // Purchases (Achats) Endpoints
  app.get('/api/purchases', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const suppliers = await dbGetSuppliers(companyId);
      res.json({
        companyId,
        suppliers,
        purchaseOrders: [
          { id: 'PO-001', supplierId: suppliers[0]?.id || 'SUP-01', item: 'Verres Organiques Essilor', quantity: 200, price: 1500000, date: '2026-06-15', status: 'Livré' },
          { id: 'PO-002', supplierId: suppliers[0]?.id || 'SUP-01', item: 'Montures Titane', quantity: 80, price: 920000, date: '2026-06-24', status: 'En cours' }
        ]
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/suppliers', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const suppliers = await dbGetSuppliers(companyId);
      res.json(suppliers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/suppliers', authenticateToken as any, validateBody(supplierSchema) as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const supplier = await dbUpsertSupplier(req.body, companyId);
      res.json(supplier);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Stock (Inventory) Endpoints
  app.get('/api/stock', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const inventory = await dbGetInventory(companyId);
      res.json(inventory);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/stock', authenticateToken as any, validateBody(inventorySchema) as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const inv = await dbUpsertInventory(req.body, companyId);
      res.json(inv);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // HR (RH) Endpoints
  app.get('/api/hr', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const collaborators = await dbGetHRCollaborators(companyId);
      res.json({
        companyId,
        collaborators,
        hrMetrics: {
          totalStaff: collaborators.length,
          activeContracts: collaborators.filter(c => c.status === 'Active').length,
          payrollFCFA: collaborators.reduce((sum, c) => sum + c.salaryFCFA, 0),
          averageTenureYears: 2.4
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Accounting (Comptabilité) Endpoints
  app.get('/api/accounting', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const summary = await dbGetAccountingSummary(companyId);
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- NEW SECURE GRAPHQL ENDPOINT ---
  app.post('/api/graphql', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
    const { query, variables } = req.body;
    const companyId = req.user?.companyId || 'TG';

    if (!query) {
      return res.status(400).json({ error: 'GraphQL query is required' });
    }

    try {
      const results: any = {};
      const queryStr = query.toLowerCase();

      // Resolve queries
      if (queryStr.includes('customers') || queryStr.includes('clients')) {
        results.customers = await dbGetCustomers(companyId);
      }
      if (queryStr.includes('sales') || queryStr.includes('ventes') || queryStr.includes('invoices')) {
        results.sales = await dbGetInvoices(companyId);
      }
      if (queryStr.includes('purchases') || queryStr.includes('achats') || queryStr.includes('suppliers')) {
        results.purchases = await dbGetSuppliers(companyId);
      }
      if (queryStr.includes('stock') || queryStr.includes('inventory') || queryStr.includes('products')) {
        results.stock = await dbGetProducts(companyId);
        results.inventory = await dbGetInventory(companyId);
      }
      if (queryStr.includes('hr') || queryStr.includes('collaborateurs') || queryStr.includes('employees')) {
        results.hr = await dbGetHRCollaborators(companyId);
      }
      if (queryStr.includes('accounting') || queryStr.includes('comptabilite') || queryStr.includes('finance')) {
        results.accounting = await dbGetAccountingSummary(companyId);
      }

      res.json({ data: results });
    } catch (err: any) {
      res.status(500).json({ errors: [{ message: err.message }] });
    }
  });

  // --- BACKUP & RESTORATION SECURE ENDPOINTS ---
  app.get('/api/backups', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
    try {
      const backups = await dbGetBackups();
      // Keep summary lightweight
      const summary = backups.map(b => ({ id: b.id, name: b.name, createdAt: b.createdAt }));
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/backups/create', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
    try {
      const { name } = req.body;
      const backup = await dbCreateBackup(name);
      
      // Save audit log
      await dbSaveAuditLog({
        userId: req.user?.id || 'USR-ADMIN-1',
        userEmail: req.user?.email || 'system@opticalize.com',
        action: `Backup manuelle créée: ${backup.name}`,
        details: `ID de sauvegarde: ${backup.id}`,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Server'
      }, req.user?.companyId || 'TG');

      res.json(backup);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/backups/restore', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
    try {
      const { backupId } = req.body;
      if (!backupId) {
        return res.status(400).json({ error: 'Le champ backupId est requis pour la restauration.' });
      }

      const success = await dbRestoreBackup(backupId);
      if (!success) {
        return res.status(404).json({ error: 'Sauvegarde introuvable ou invalide.' });
      }

      // Save audit log
      await dbSaveAuditLog({
        userId: req.user?.id || 'USR-ADMIN-1',
        userEmail: req.user?.email || 'system@opticalize.com',
        action: `Restauration de la base effectuée`,
        details: `Backup ID: ${backupId}`,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Server'
      }, req.user?.companyId || 'TG');

      res.json({ success: true, message: 'La base de données a été restaurée avec succès.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Background Automatic Backups (Every 1 Hour)
  setInterval(async () => {
    try {
      console.log('[AUTO-BACKUP] Triggering automatic database backup snapshot...');
      await dbCreateBackup(`Sauvegarde Automatique - ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`);
    } catch (err: any) {
      console.error('[AUTO-BACKUP] Failed to trigger auto backup:', err);
    }
  }, 3600000);

  // Trigger one immediate backup on startup
  try {
    dbCreateBackup(`Sauvegarde Initiale Système - ${new Date().toLocaleDateString('fr-FR')}`);
  } catch (err) {
    console.error('Initial startup backup failed:', err);
  }

  // 2. API - Génération d'architecture G-LAB OPTIC par IA (Gemini-3.5-flash)
  app.post('/api/generate', async (req, res) => {
    const { prompt, currentContext } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Le champ "prompt" est requis.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Le service d\'IA n\'est pas encore configuré. Veuillez renseigner votre clé dans l\'onglet Secrets de Google AI Studio.',
      });
    }

    try {
      const promptInstruction = `
      Agis comme l'architecte logiciel principal de Optic Alizé.
      L'utilisateur demande d'étendre ou d'ajouter une fonctionnalité dans l'ERP SaaS optique sous la forme de : "${prompt}".
      
      Génère STRICTEMENT les fichiers de code Clean Architecture correspondants.
      Tu dois renvoyer exactement de 3 à 5 fichiers structurés, chacun ayant un nom, un chemin correct, une description, un langage, et le code complet.
      
      Formate la réponse en JSON valide respectant cette structure exacte :
      {
        "files": [
          {
            "name": "nom_du_fichier.dart",
            "path": "chemin/vers/nom_du_fichier.dart",
            "language": "dart",
            "module": "Nom du module ou sous-module",
            "layer": "domain" ou "data" ou "presentation" ou "backend" ou "database",
            "type": "entity" ou "model" ou "repository" ou "provider" ou "route" ou "middleware" ou "controller" ou "service" ou "schema",
            "description": "Explication brève du rôle de ce fichier dans l'ERP.",
            "content": "CODE COMPLET SANS COUPE"
          }
        ]
      }
      
      Le code généré doit être professionnel, rédigé en français pour les commentaires/descriptions et en anglais/français pour le code, complet, et correspondre à l'architecture de Optic Alizé (Flutter Web + Riverpod + Clean Arch, Backend Express + Postgres/Supabase).
      Génère du VRAI code, pas de mocks tronqués.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptInstruction,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'Tu es l\'architecte logiciel exclusif de l\'ERP SaaS Optic Alizé. Tu ne génères que du JSON valide respectant scrupuleusement le format de fichier demandé.',
        },
      });

      const responseText = response.text || '{}';
      try {
        const parsedJson = JSON.parse(responseText);
        res.json(parsedJson);
      } catch (parseError) {
        console.error('Erreur de parsing de la réponse de Gemini :', responseText);
        res.status(500).json({
          error: 'Gemini a produit un format JSON corrompu. Veuillez réessayer.',
          raw: responseText,
        });
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'appel de Gemini API :', err);
      res.status(500).json({ error: err.message || 'Erreur interne lors de la génération avec l\'IA.' });
    }
  });

  // Helpers pour la reconnaissance faciale biométrique
  const parseDataUrl = (dataUrl: string) => {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  };

  const fetchImageAsBase64 = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      return {
        mimeType: contentType,
        data: buffer.toString('base64')
      };
    } catch (error) {
      console.error(`Error fetching candidate image from ${url}:`, error);
      return null;
    }
  };

  // 2.5 API - Reconnaissance biométrique faciale via Gemini
  app.post('/api/presence/identify', async (req, res) => {
    const { webcamImage, livenessChallengeImage, candidates } = req.body;

    if (!webcamImage) {
      return res.status(400).json({ error: 'L\'image de la webcam est requise.' });
    }

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'La liste des collaborateurs candidats est requise.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Le service d\'IA n\'est pas encore configuré. Veuillez renseigner votre clé dans l\'onglet Secrets de Google AI Studio.',
      });
    }

    try {
      const parsedWebcam = parseDataUrl(webcamImage);
      if (!parsedWebcam) {
        return res.status(400).json({ error: 'Format d\'image webcam invalide.' });
      }

      const parsedChallenge = livenessChallengeImage ? parseDataUrl(livenessChallengeImage) : null;

      const prompt = `
      Tu es un système de reconnaissance faciale biométrique de HAUTE SÉCURITÉ d'Optic Alizé.
      Ton rôle est de faire deux choses :
      1. ANALYSE ANTI-SPOOFING MULTI-COUCHES : Détecter et contrer toute tentative d'usurpation d'identité ou d'attaque par rejeu (par exemple, présenter une photo imprimée sur papier, afficher l'image d'un employé sur un smartphone/tablette, ou rediffuser une vidéo).
      2. RECONNAISSANCE BIOMÉTRIQUE : Comparer l'image capturée avec les photos de référence des candidats enregistrés dans le roster RH.

      SÉCURITÉ MAXIMUM - PROTOCOLE ZÉRO FAUX POSITIF :
      - S'il y a le moindre indice de spoofing (contours de papier froissés, reflets d'écran, trame de pixels LCD/OLED, moirage, cadrage anormal, absence totale de micro-mouvement d'expression faciale), tu DOIS refuser la connexion (matchedId: "unknown", score: 0).
      - Si deux images de webcam (IMAGE CIBLE PRINCIPALE et IMAGE DÉFI DE VIVACITÉ) te sont fournies :
        a) Elles doivent correspondre à la même personne.
        b) Elles doivent impérativement présenter un changement d'expression naturel et subtil (comme cligner des yeux, sourire ou tourner légèrement la tête) prouvant que le flux est vivant et dynamique.
        c) Si les deux images sont rigoureusement identiques au pixel près, cela indique une tentative de triche avec une photo statique téléchargée. Refuse immédiatement !

      Analyse faciale minutieuse :
      - Compare la structure osseuse, la forme des yeux, la forme du nez, les lèvres, les sourcils, l'espacement oculaire, la pilosité faciale (barbe/moustache) et les contours généraux.
      - Ne te base pas sur les vêtements ni sur l'arrière-plan.
      - Si le candidat a été supprimé ou est inconnu, ne l'associe pas à une personne ressemblante.

      Tu reçois :
      1. IMAGE CIBLE PRINCIPALE (Image webcam initiale).
      2. IMAGE DÉFI DE VIVACITÉ (Optionnelle - Image capturée pendant le défi de sourire ou de clignement).
      3. Liste des photos de référence de chaque collaborateur candidat, précédée de son identification sous le format "=== CANDIDAT : ID = {id}, Nom = {name} ===".

      Renvoie obligatoirement un objet JSON STRICTEMENT sous ce format :
      {
        "matchedId": "ID_DU_COLLABORATEUR_SÉLECTIONNÉ" ou "unknown",
        "score": un nombre entier entre 0 et 100 représentant la confiance de la correspondance (ne doit être >= 95 que s'il y a certitude absolue),
        "reason": "Une explication détaillée en français justifiant la décision (ex. confirmation de vivacité neuromusculaire, détection de reflets LCD/OLED suspect, ou absence de correspondance biométrique valide)."
      }
      `;

      const parts: any[] = [
        { text: prompt },
        { text: "=== IMAGE CIBLE PRINCIPALE ===" },
        {
          inlineData: {
            mimeType: parsedWebcam.mimeType,
            data: parsedWebcam.data
          }
        }
      ];

      if (parsedChallenge) {
        parts.push({ text: "=== IMAGE DÉFI DE VIVACITÉ ===" });
        parts.push({
          inlineData: {
            mimeType: parsedChallenge.mimeType,
            data: parsedChallenge.data
          }
        });
      }

      // Récupérer et encoder les images des candidats (avec support multi-angles haute sécurité)
      for (const cand of candidates) {
        parts.push({ text: `=== CANDIDAT : ID = ${cand.id}, Nom = ${cand.firstName} ${cand.lastName} ===` });
        let addedAny = false;

        // Si l'employé possède un gabarit multi-angles complet
        if (cand.photoAngles) {
          const angles = ['front', 'profile', 'smile', 'blink'] as const;
          for (const angle of angles) {
            const imgData = cand.photoAngles[angle];
            if (imgData) {
              const parsed = parseDataUrl(imgData);
              if (parsed) {
                parts.push({ text: `ANGLE DE RÉFÉRENCE COMPLIANT : ${angle.toUpperCase()}` });
                parts.push({
                  inlineData: {
                    mimeType: parsed.mimeType,
                    data: parsed.data
                  }
                });
                addedAny = true;
              }
            }
          }
        }

        // Sinon, fallback sur le portrait principal unique
        if (!addedAny && cand.photo) {
          let partData = null;
          if (cand.photo.startsWith('data:')) {
            partData = parseDataUrl(cand.photo);
          } else if (cand.photo.startsWith('http')) {
            partData = await fetchImageAsBase64(cand.photo);
          }
          if (partData) {
            parts.push({ text: "IMAGE PORTRAIT PRINCIPALE" });
            parts.push({
              inlineData: {
                mimeType: partData.mimeType,
                data: partData.data
              }
            });
          }
        }
      }

      parts.push({ text: "Effectue la comparaison maintenant et retourne le JSON." });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'Tu es un expert en biométrie faciale et sécurité militaire de haut niveau. Tu n\'autorises de correspondance que si l\'identité est indiscutable. Tu renvoies exclusivement un objet JSON valide.',
          temperature: 0.0,
        },
      });

      const responseText = response.text || '{}';
      try {
        const parsedJson = JSON.parse(responseText);
        res.json(parsedJson);
      } catch (parseError) {
        console.error('Erreur de parsing de la réponse de Gemini :', responseText);
        res.status(500).json({
          error: 'L\'IA a renvoyé un format corrompu. Veuillez réessayer.',
          raw: responseText
        });
      }

    } catch (err: any) {
      console.error('Erreur lors de la reconnaissance faciale avec Gemini :', err);
      res.status(500).json({ error: err.message || 'Erreur interne lors de la reconnaissance faciale.' });
    }
  });

  // 3. Configuration du middleware Vite ou distribution Statique en production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  interface ClientInfo {
    id: string;
    username: string;
    role: string;
    shop: string;
    socket: WebSocket;
  }

  // In-memory data store for messages, announcements, locks & clients
  const activeClients = new Map<string, ClientInfo>();
  const activeLocks = new Map<string, { userId: string, username: string, documentId: string, lockedAt: string }>();
  
  const serverMessages = [
    {
      id: 'msg_1',
      chatType: 'group',
      channelId: 'general',
      senderId: 'staff_1',
      senderName: 'Sophie (Opticienne-Conseil)',
      senderShop: 'Paris Opéra',
      content: 'Bonjour à tous ! Est-ce que quelqu\'un a reçu la nouvelle livraison Ray-Ban de la collection été ? On a un patient qui attend sa monture.',
      createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString()
    },
    {
      id: 'msg_2',
      chatType: 'group',
      channelId: 'general',
      senderId: 'staff_2',
      senderName: 'Jean-Marc (Montage Labo)',
      senderShop: 'Nice Centre',
      content: 'Oui Sophie ! Reçue ce matin à Nice. Le code barre SKU est déjà injecté en base de données, tu peux faire la commande à l\'atelier.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'msg_3',
      chatType: 'group',
      channelId: 'atelier',
      senderId: 'staff_2',
      senderName: 'Jean-Marc (Montage Labo)',
      senderShop: 'Nice Centre',
      content: 'Alerte meuleuse : J\'ai nettoyé le filtre de la meuleuse Essilor Kappa. Consommables OK.',
      createdAt: new Date(Date.now() - 3650000).toISOString()
    }
  ];

  const serverAnnouncements = [
    {
      id: 'ann_1',
      title: 'Campagne Tiers-Payant Mutuelles 2026',
      content: 'Le renouvellement d\'accord tiers payant avec le réseau de mutuelles KALIXIA est effectif. Pensez à scanner le QR code de carte de mutuelle.',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      senderName: 'Direction SaaS Optic Alizé'
    }
  ];

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Optic Alizé dev Server] Running on http://localhost:${PORT}`);
  });

  // Attach real WebSocket Server (wss) to same port 3000
  const wss = new WebSocketServer({ server });

  // Function to broadcast event payload to all or specific registered clients
  const broadcast = (payload: any, excludeClientId?: string) => {
    const rawPayload = JSON.stringify(payload);
    activeClients.forEach((client) => {
      if (client.id !== excludeClientId && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(rawPayload);
      }
    });
  };

  wss.on('connection', (socket: WebSocket) => {
    let clientUserId: string | null = null;

    console.log('[WebSocket Server] Nouvelle connexion entrante.');

    socket.on('message', (messageBuffer) => {
      try {
        const rawMessage = messageBuffer.toString();
        const data = JSON.parse(rawMessage);

        switch (data.type) {
          case 'register': {
            clientUserId = data.user.id;
            activeClients.set(clientUserId!, {
              id: data.user.id,
              username: data.user.username,
              role: data.user.role,
              shop: data.user.shop,
              socket: socket
            });

            console.log(`[WebSocket Server] Utilisateur enregistré : ${data.user.username} (${data.user.role})`);

            // Send initial ERP state to the newly connected socket
            socket.send(JSON.stringify({
              type: 'init',
              messages: serverMessages,
              announcements: serverAnnouncements,
              onlineUsers: Array.from(activeClients.values()).map(c => ({
                id: c.id,
                username: c.username,
                role: c.role,
                shop: c.shop
              }))
            }));

            // Notify everyone database-wide that a new boutique opticien has logged in
            broadcast({
              type: 'user_joined',
              user: {
                id: data.user.id,
                username: data.user.username,
                role: data.user.role,
                shop: data.user.shop
              }
            }, clientUserId!);

            // Trigger a push notification event
            broadcast({
              type: 'notification',
              notification: {
                id: 'notif_join_' + Date.now(),
                title: 'Connexion Personnel',
                message: `${data.user.username} (${data.user.shop}) s'est connecté au canal temps réel d'Optic Alizé.`,
                createdAt: new Date().toISOString()
              }
            });
            break;
          }

          case 'message': {
            if (!clientUserId) return;
            const client = activeClients.get(clientUserId);
            if (!client) return;

            const newMsg = {
              id: 'msg_' + Date.now(),
              chatType: data.message.chatType || 'group',
              channelId: data.message.channelId,
              recipientId: data.message.recipientId,
              senderId: client.id,
              senderName: client.username,
              senderShop: client.shop,
              content: data.message.content,
              attachment: data.message.attachment || null, // pieces jointes support
              createdAt: new Date().toISOString()
            };

            serverMessages.push(newMsg);

            // Broadcast message back to ALL clients to allow real-time reactivity in preview
            broadcast({
              type: 'message_received',
              message: newMsg
            });

            // Send generic live notification
            broadcast({
              type: 'notification',
              notification: {
                id: 'notif_msg_' + Date.now(),
                title: newMsg.chatType === 'private' ? 'Message Privé' : `Canal #${newMsg.channelId}`,
                message: `${newMsg.senderName} : ${newMsg.content.substring(0, 40)}${newMsg.content.length > 40 ? '...' : ''}`,
                createdAt: new Date().toISOString()
              }
            }, client.id); // Exclude sender from receipt of their own notification Toast
            break;
          }

          case 'announcement': {
            if (!clientUserId) return;
            const client = activeClients.get(clientUserId);
            if (!client) return;

            const newAnn = {
              id: 'ann_' + Date.now(),
              title: data.announcement.title,
              content: data.announcement.content,
              createdAt: new Date().toISOString(),
              senderName: client.username
            };

            serverAnnouncements.push(newAnn);

            // Broadcast announcement to everyone
            broadcast({
              type: 'announcement_received',
              announcement: newAnn
            });

            // Trigger severe notification
            broadcast({
              type: 'notification',
              notification: {
                id: 'notif_ann_' + Date.now(),
                title: '🚨 ANNONCE GÉNÉRALE',
                message: `${newAnn.title} : ${newAnn.content.substring(0, 60)}...`,
                createdAt: new Date().toISOString()
              }
            });
            break;
          }

          case 'typing': {
            if (!clientUserId) return;
            // Broadcast typing state to other clients
            broadcast({
              type: 'typing_broadcast',
              typingState: {
                isTyping: data.typingState.isTyping,
                senderId: clientUserId,
                senderName: data.typingState.senderName,
                recipientId: data.typingState.recipientId,
                channelId: data.typingState.channelId
              }
            }, clientUserId);
            break;
          }

          case 'lock_acquire': {
            const { documentId, username } = data;
            if (!clientUserId || !documentId) return;

            const existingLock = activeLocks.get(documentId);
            if (existingLock && existingLock.userId !== clientUserId) {
              // Lock held by someone else
              socket.send(JSON.stringify({
                type: 'lock_denied',
                documentId,
                holderName: existingLock.username,
                lockedAt: existingLock.lockedAt
              }));
            } else {
              // Acquire lock
              const lockDetails = {
                userId: clientUserId,
                username: username || 'Un autre utilisateur',
                documentId,
                lockedAt: new Date().toISOString()
              };
              activeLocks.set(documentId, lockDetails);
              
              socket.send(JSON.stringify({
                type: 'lock_granted',
                documentId
              }));

              // Notify everyone about the lock
              broadcast({
                type: 'document_locked',
                documentId,
                holderName: lockDetails.username,
                holderId: clientUserId
              }, clientUserId);
            }
            break;
          }

          case 'lock_release': {
            const { documentId } = data;
            if (!clientUserId || !documentId) return;

            const existingLock = activeLocks.get(documentId);
            if (existingLock && existingLock.userId === clientUserId) {
              activeLocks.delete(documentId);
              
              socket.send(JSON.stringify({
                type: 'lock_released_confirm',
                documentId
              }));

              broadcast({
                type: 'document_unlocked',
                documentId
              }, clientUserId);
            }
            break;
          }

          case 'sync_change': {
            const { documentId, fieldName, fieldValue, username } = data;
            if (!clientUserId || !documentId) return;

            // Broadcast real-time field edits to other team members to prevent edit overlap
            broadcast({
              type: 'live_field_update',
              documentId,
              fieldName,
              fieldValue,
              updaterName: username || 'Collaborateur',
              updaterId: clientUserId
            }, clientUserId);
            break;
          }

          default:
            console.log(`[WebSocket Server] Type d'événement inconnu : ${data.type}`);
        }
      } catch (err) {
        console.error('[WebSocket Server] Erreur de parsing du message :', err);
      }
    });

    socket.on('close', () => {
      if (clientUserId) {
        const client = activeClients.get(clientUserId);
        if (client) {
          console.log(`[WebSocket] Déconnexion : ${client.username}`);
          activeClients.delete(clientUserId);

          // Clean up locks held by this client
          activeLocks.forEach((lock, docId) => {
            if (lock.userId === clientUserId) {
              activeLocks.delete(docId);
              broadcast({
                type: 'document_unlocked',
                documentId: docId
              });
            }
          });

          // Broadcast user left event
          broadcast({
            type: 'user_left',
            userId: clientUserId
          });
        }
      }
    });
  });

}

startServer();
