import { Router, Response } from 'express';
import { dbGetProducts, dbUpsertProduct, dbGetSuppliers, dbUpsertSupplier, dbDeleteProduct } from '../../../db';
import { authenticateToken, requirePermission, enforceTenantIsolation, AuthenticatedRequest } from '../../core/tenant';
import { validateBody, productSchema, supplierSchema } from '../../core/validator';

const router = Router();

// Products List
router.get('/products', authenticateToken as any, requirePermission('read:products') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const products = await dbGetProducts(companyId);
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert Product
router.post('/products', authenticateToken as any, requirePermission('write:products') as any, validateBody(productSchema) as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const product = await dbUpsertProduct(req.body, companyId);
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Product
router.delete('/products/:id', authenticateToken as any, requirePermission('write:products') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dbDeleteProduct(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Suppliers List
router.get('/suppliers', authenticateToken as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const suppliers = await dbGetSuppliers(companyId);
    res.json(suppliers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert Supplier
router.post('/suppliers', authenticateToken as any, validateBody(supplierSchema) as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const supplier = await dbUpsertSupplier(req.body, companyId);
    res.json(supplier);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
