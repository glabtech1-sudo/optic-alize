import { Router, Response } from 'express';
import { backupService } from './backup.service';
import { dbSaveAuditLog } from '../../../db';
import { authenticateToken, enforceTenantIsolation, AuthenticatedRequest } from '../../core/tenant';

const router = Router();

// 1. Backups list
router.get('/backups', authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const backups = await backupService.getBackupsList();
    res.json(backups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get schedule config
router.get('/backups/schedule', authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = backupService.getScheduleConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update schedule config
router.post('/backups/schedule', authenticateToken as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { intervalHours, enabled } = req.body;
    if (typeof intervalHours !== 'number' || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Champs requis: intervalHours (nombre) et enabled (booléen).' });
    }

    backupService.updateScheduleConfig({ intervalHours, enabled });

    // Save audit log
    await dbSaveAuditLog({
      userId: req.user?.id || 'USR-ADMIN-1',
      userEmail: req.user?.email || 'system@opticalize.com',
      action: `Planification de sauvegarde mise à jour`,
      details: `Activé: ${enabled}, Intervalle: ${intervalHours}h`,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Server'
    }, req.user?.companyId || 'TG');

    res.json({ success: true, config: backupService.getScheduleConfig() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create Backup snapshot
router.post('/backups/create', authenticateToken as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const backup = await backupService.createBackup(name, 'Manuelle');
    
    // Save audit log
    await dbSaveAuditLog({
      userId: req.user?.id || 'USR-ADMIN-1',
      userEmail: req.user?.email || 'system@opticalize.com',
      action: `Backup manuelle créée: ${backup.name}`,
      details: `ID de sauvegarde: ${backup.id} (Checksum SHA256: ${backup.checksum.slice(0, 10)}...)`,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Server'
    }, req.user?.companyId || 'TG');

    res.json(backup);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Verify Backup integrity on-demand
router.get('/backups/:id/verify', authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const backupId = req.params.id;
    const result = await backupService.verifyBackup(backupId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Restore Backup snapshot
router.post('/backups/restore', authenticateToken as any, enforceTenantIsolation as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { backupId } = req.body;
    if (!backupId) {
      return res.status(400).json({ error: 'Le champ backupId est requis pour la restauration.' });
    }

    const success = await backupService.restoreBackup(backupId);
    if (!success) {
      return res.status(404).json({ error: 'Sauvegarde introuvable ou échec de la restauration.' });
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

export default router;
