import { Router, Response } from 'express';
import { dbGetCompanies, dbUpsertCompany, dbGetBranches, dbUpsertBranch } from '../../../db';
import { authenticateToken, requirePermission, enforceTenantIsolation, AuthenticatedRequest } from '../../core/tenant';

const router = Router();

// Companies List
router.get('/companies', authenticateToken as any, requirePermission('read:companies') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companies = await dbGetCompanies();
    // Filter companies so a tenant can only see their own company (strict isolation)
    const filtered = companies.filter(c => c.id === req.user?.companyId);
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert Company
router.post('/companies', authenticateToken as any, requirePermission('write:companies') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const company = await dbUpsertCompany(req.body);
    res.json(company);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Branches / Boutiques List
router.get('/branches', authenticateToken as any, requirePermission('read:branches') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const branches = await dbGetBranches(companyId);
    
    // Strict multi-boutique filtering for non-admin users
    const isGlobal = ['Admin', 'Concepteur'].includes(req.user?.role || '');
    const filtered = isGlobal 
      ? branches 
      : branches.filter(b => req.user?.allowedBoutiques.includes(b.code || b.id));

    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert Branch / Boutique
router.post('/branches', authenticateToken as any, requirePermission('write:branches') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const branch = await dbUpsertBranch(req.body, companyId);
    res.json(branch);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
