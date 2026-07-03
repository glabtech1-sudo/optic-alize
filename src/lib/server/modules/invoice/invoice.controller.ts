import { Router, Response } from 'express';
import {
  dbGetInvoices,
  dbSaveInvoice,
  dbGetSuppliers,
  dbGetAccountingSummary,
  dbGetCustomers,
  dbGetProducts,
  dbGetInventory,
  dbGetHRCollaborators
} from '../../../db';
import { authenticateToken, requirePermission, enforceTenantIsolation, AuthenticatedRequest } from '../../core/tenant';
import { validateBody, invoiceSchema } from '../../core/validator';

const router = Router();

// Invoices List
router.get('/invoices', authenticateToken as any, requirePermission('read:invoices') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const invoices = await dbGetInvoices(companyId);
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Invoice
router.post('/invoices', authenticateToken as any, requirePermission('write:invoices') as any, validateBody(invoiceSchema) as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const invoice = await dbSaveInvoice(req.body, companyId);
    res.json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Purchases (Achats) Endpoint
router.get('/purchases', authenticateToken as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
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

// Accounting (Comptabilité) Endpoint
router.get('/accounting', authenticateToken as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const summary = await dbGetAccountingSummary(companyId);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GraphQL API
router.post('/graphql', authenticateToken as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  const { query } = req.body;
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

export default router;
