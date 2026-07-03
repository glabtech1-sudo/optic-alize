import { Router, Response } from 'express';
import { 
  dbGetCustomers, 
  dbUpsertCustomer, 
  dbDeleteCustomer,
  dbGetAppointments,
  dbUpsertAppointment,
  dbDeleteAppointment,
  dbGetSightExams,
  dbUpsertSightExam,
  dbDeleteSightExam,
  dbGetClinicPrescriptions,
  dbUpsertClinicPrescription,
  dbDeleteClinicPrescription
} from '../../../db';
import { authenticateToken, requirePermission, enforceTenantIsolation, AuthenticatedRequest } from '../../core/tenant';
import { validateBody, customerSchema } from '../../core/validator';

const router = Router();

// Customers List
router.get('/customers', authenticateToken as any, requirePermission('read:customers') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const customers = await dbGetCustomers(companyId);
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert Customer
router.post('/customers', authenticateToken as any, requirePermission('write:customers') as any, validateBody(customerSchema) as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const customer = await dbUpsertCustomer(req.body, companyId);
    res.json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Customer
router.delete('/customers/:id', authenticateToken as any, requirePermission('write:customers') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dbDeleteCustomer(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clinic Appointments List
router.get('/clinic/appointments', authenticateToken as any, requirePermission('read:clinical') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const data = await dbGetAppointments(companyId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert Appointment
router.post('/clinic/appointments', authenticateToken as any, requirePermission('write:clinical') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const data = await dbUpsertAppointment(req.body, companyId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Appointment
router.delete('/clinic/appointments/:id', authenticateToken as any, requirePermission('write:clinical') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dbDeleteAppointment(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sight Exams List
router.get('/clinic/exams', authenticateToken as any, requirePermission('read:clinical') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const data = await dbGetSightExams(companyId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert Sight Exam
router.post('/clinic/exams', authenticateToken as any, requirePermission('write:clinical') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const data = await dbUpsertSightExam(req.body, companyId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Sight Exam
router.delete('/clinic/exams/:id', authenticateToken as any, requirePermission('write:clinical') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dbDeleteSightExam(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clinic Prescriptions List
router.get('/clinic/prescriptions', authenticateToken as any, requirePermission('read:clinical') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const data = await dbGetClinicPrescriptions(companyId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert Clinic Prescription
router.post('/clinic/prescriptions', authenticateToken as any, requirePermission('write:clinical') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId || 'TG';
    const data = await dbUpsertClinicPrescription(req.body, companyId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Clinic Prescription
router.delete('/clinic/prescriptions/:id', authenticateToken as any, requirePermission('write:clinical') as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await dbDeleteClinicPrescription(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
