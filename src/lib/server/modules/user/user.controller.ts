import { Router, Response } from 'express';
import { dbGetUsers, dbUpsertUser, dbDeleteUser } from '../../../db';
import { authenticateToken, requirePermission, enforceTenantIsolation, AuthenticatedRequest } from '../../core/tenant';

const router = Router();

// Users List
router.get('/users', authenticateToken as any, requirePermission('read:users') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const users = await dbGetUsers(companyId);
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert User
router.post('/users', authenticateToken as any, requirePermission('write:users') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const user = await dbUpsertUser(req.body, companyId);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete User
router.delete('/users/:email', authenticateToken as any, requirePermission('delete:users') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.params;
    
    // Safety check: Prevent deleting yourself
    if (email.toLowerCase().trim() === req.user?.email.toLowerCase().trim()) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte utilisateur.' });
    }

    // Verify the target user belongs to the same company
    const users = await dbGetUsers(req.user?.companyId);
    const target = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!target) {
      return res.status(404).json({ error: 'Collaborateur introuvable dans votre entreprise.' });
    }

    const success = await dbDeleteUser(email);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
