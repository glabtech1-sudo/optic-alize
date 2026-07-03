import { Router, Response } from 'express';
import { dbGetInventory, dbUpsertInventory } from '../../../db';
import { authenticateToken, requirePermission, enforceTenantIsolation, AuthenticatedRequest } from '../../core/tenant';
import { validateBody, inventorySchema } from '../../core/validator';

const router = Router();

// Inventory List
router.get('/stock', authenticateToken as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const inventory = await dbGetInventory(companyId);
    res.json(inventory);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert Inventory Item
router.post('/stock', authenticateToken as any, validateBody(inventorySchema) as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const inv = await dbUpsertInventory(req.body, companyId);
    res.json(inv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
