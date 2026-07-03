import { Router, Response } from 'express';
import { z } from 'zod';
import { storageService } from './storage.service';
import { authenticateToken, requirePermission, enforceTenantIsolation, AuthenticatedRequest } from '../../core/tenant';
import { dbSaveAuditLog } from '../../../db';

const storageRouter = Router();

// Zod Validation Schemas
const uploadFileSchema = z.object({
  originalname: z.string().min(1, 'Nom de fichier requis'),
  mimetype: z.string().min(1, 'Type MIME requis'),
  base64Data: z.string().min(1, 'Données base64 requises'),
  isPrivate: z.boolean().default(true)
});

/**
 * Endpoint: List all files for the current tenant
 */
storageRouter.get(
  '/storage/files',
  authenticateToken as any,
  enforceTenantIsolation as any,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const companyId = req.user?.companyId || 'TG';
      const role = req.user?.role || 'Viewer';
      const files = await storageService.listFiles(companyId, role);
      
      // Map files to include secure direct download URLs
      const filesWithUrls = await Promise.all(
        files.map(async (f) => {
          try {
            const downloadUrl = await storageService.getDownloadUrl(f.id, companyId, role);
            return { ...f, downloadUrl };
          } catch (e) {
            return { ...f, downloadUrl: null };
          }
        })
      );

      res.json({ success: true, files: filesWithUrls });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint: Upload a file (Base64 format for safe sandbox payload handling)
 */
storageRouter.post(
  '/storage/upload',
  authenticateToken as any,
  enforceTenantIsolation as any,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      // Validate payload with Zod
      const payload = uploadFileSchema.parse(req.body);

      const companyId = req.user?.companyId || 'TG';
      const userId = req.user?.id || 'anonymous';
      const userEmail = req.user?.email || 'unknown';

      // Convert Base64 back to binary Buffer
      const buffer = Buffer.from(payload.base64Data, 'base64');

      const uploadedFile = await storageService.uploadFile(
        {
          buffer,
          originalname: payload.originalname,
          mimetype: payload.mimetype
        },
        companyId,
        userId,
        payload.isPrivate
      );

      // Save Audit Log
      await dbSaveAuditLog({
        companyId,
        userId,
        userEmail,
        action: 'STORAGE_UPLOAD',
        details: `Téléchargement réussi du fichier '${payload.originalname}' (${payload.mimetype}, ${buffer.length} octets) en mode ${payload.isPrivate ? 'PRIVÉ' : 'PUBLIC'}. ID du fichier: ${uploadedFile.id}.`
      }, companyId);

      // Generate secure download URL for response
      const downloadUrl = await storageService.getDownloadUrl(uploadedFile.id, companyId, req.user?.role || 'Viewer');

      res.status(201).json({
        success: true,
        message: 'Fichier importé avec succès.',
        file: {
          ...uploadedFile,
          downloadUrl
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint: Secure download / proxy stream of private and public files
 */
storageRouter.get(
  '/storage/files/:id/download',
  authenticateToken as any,
  enforceTenantIsolation as any,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const fileId = req.params.id;
      const companyId = req.user?.companyId || 'TG';
      const userId = req.user?.id || 'anonymous';
      const userEmail = req.user?.email || 'unknown';
      const role = req.user?.role || 'Viewer';

      const fileData = await storageService.getFile(fileId, companyId, role);
      if (!fileData) {
        return res.status(404).json({ error: 'Fichier introuvable ou accès refusé.' });
      }

      // Save Audit Log
      await dbSaveAuditLog({
        companyId,
        userId,
        userEmail,
        action: 'STORAGE_DOWNLOAD',
        details: `Fichier '${fileData.originalname}' (ID: ${fileId}) consulté et téléchargé par l'utilisateur.`
      }, companyId);

      // Send appropriate headers and response buffer
      res.setHeader('Content-Type', fileData.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.originalname)}"`);
      res.send(fileData.buffer);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Endpoint: Delete a file
 */
storageRouter.delete(
  '/storage/files/:id',
  authenticateToken as any,
  requirePermission('delete:users') as any, // Only users with administrative rights can delete
  enforceTenantIsolation as any,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const fileId = req.params.id;
      const companyId = req.user?.companyId || 'TG';
      const userId = req.user?.id || 'anonymous';
      const userEmail = req.user?.email || 'unknown';
      const role = req.user?.role || 'Viewer';

      const deleted = await storageService.deleteFile(fileId, companyId, role);
      if (!deleted) {
        return res.status(404).json({ error: 'Fichier introuvable.' });
      }

      // Save Audit Log
      await dbSaveAuditLog({
        companyId,
        userId,
        userEmail,
        action: 'STORAGE_DELETE',
        details: `Fichier ID '${fileId}' supprimé définitivement du stockage.`
      }, companyId);

      res.json({ success: true, message: 'Fichier supprimé définitivement.' });
    } catch (err) {
      next(err);
    }
  }
);

export default storageRouter;
