import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  dbGetCompanies, 
  dbGetBranches, 
  dbGetUsers, 
  dbGetCustomers, 
  dbGetProducts, 
  dbGetInvoices, 
  dbGetSuppliers, 
  dbGetInventory, 
  dbGetAuditLogs,
  dbSaveAuditLog,
  writeFallback
} from '../../../db';
import { readStorage, writeStorage } from '../../core/database';

export interface BackupMetadata {
  id: string;
  name: string;
  createdAt: string;
  type: 'Automatique' | 'Manuelle';
  size: number;
  checksum: string;
  integrityStatus: 'Valide' | 'Corrompu';
  recordCounts: {
    companies: number;
    branches: number;
    users: number;
    customers: number;
    products: number;
    invoices: number;
    suppliers: number;
    inventory: number;
    auditLogs: number;
  };
}

const backupsDir = path.resolve(process.cwd(), './backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

class BackupService {
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start automatic scheduler upon module load
    this.startScheduler();
  }

  /**
   * Fetch current scheduler configuration
   */
  public getScheduleConfig(): { intervalHours: number; enabled: boolean; lastRun: string | null } {
    return readStorage('backup_schedule_config', {
      intervalHours: 24, // Default to daily (24h)
      enabled: true,
      lastRun: null
    });
  }

  /**
   * Save schedule config and restart the scheduler
   */
  public updateScheduleConfig(config: { intervalHours: number; enabled: boolean }): void {
    const current = this.getScheduleConfig();
    const updated = {
      ...current,
      ...config
    };
    writeStorage('backup_schedule_config', updated);
    this.startScheduler();
    console.log(`[BACKUP SERVICE] Backup schedule updated: Enabled=${updated.enabled}, Interval=${updated.intervalHours}h`);
  }

  /**
   * Core Scheduler loop
   */
  public startScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    const config = this.getScheduleConfig();
    if (!config.enabled) {
      console.log('[BACKUP SERVICE] Auto-backup scheduler is disabled.');
      return;
    }

    console.log(`[BACKUP SERVICE] Auto-backup scheduler started. Interval is ${config.intervalHours} hours.`);

    // Run verification check every 15 minutes (or on startup if never run)
    const runCheck = async () => {
      try {
        const currentConfig = this.getScheduleConfig();
        if (!currentConfig.enabled) return;

        const now = Date.now();
        const lastRunTime = currentConfig.lastRun ? new Date(currentConfig.lastRun).getTime() : 0;
        const intervalMs = currentConfig.intervalHours * 60 * 60 * 1000;

        if (now - lastRunTime >= intervalMs) {
          console.log('[BACKUP SERVICE] Auto-backup is due. Creating backup...');
          const dateStr = new Date().toLocaleDateString('fr-FR');
          await this.createBackup(`Sauvegarde Automatique - ${dateStr}`, 'Automatique');
        }
      } catch (err) {
        console.error('[BACKUP SERVICE] Error in auto-backup run check:', err);
      }
    };

    // Run initial check after a brief delay so the server boots completely
    setTimeout(() => {
      runCheck();
    }, 5000);

    // Schedule periodic checks every 10 minutes
    this.schedulerInterval = setInterval(runCheck, 10 * 60 * 1000);
  }

  /**
   * Create a full-snapshot backup of the database
   */
  public async createBackup(name: string, type: 'Automatique' | 'Manuelle' = 'Manuelle'): Promise<BackupMetadata> {
    const companies = await dbGetCompanies();
    const branches = await dbGetBranches();
    const users = await dbGetUsers();
    const customers = await dbGetCustomers();
    const products = await dbGetProducts();
    const invoices = await dbGetInvoices();
    const suppliers = await dbGetSuppliers();
    const inventory = await dbGetInventory();
    const auditLogs = await dbGetAuditLogs();

    const payload = {
      companies,
      branches,
      users,
      customers,
      products,
      invoices,
      suppliers,
      inventory,
      auditLogs
    };

    const recordCounts = {
      companies: companies.length,
      branches: branches.length,
      users: users.length,
      customers: customers.length,
      products: products.length,
      invoices: invoices.length,
      suppliers: suppliers.length,
      inventory: inventory.length,
      auditLogs: auditLogs.length
    };

    const backupId = `backup-${Date.now()}`;
    const backupFile = path.join(backupsDir, `${backupId}.json`);

    // Serialize payload to calculate content size & secure checksum
    const serializedPayload = JSON.stringify(payload, null, 2);
    const checksum = crypto.createHash('sha256').update(serializedPayload).digest('hex');

    const backupItem = {
      id: backupId,
      name: name || `${type} Backup - ${new Date().toLocaleDateString('fr-FR')}`,
      createdAt: new Date().toISOString(),
      type,
      checksum,
      recordCounts,
      payload
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupItem, null, 2), 'utf-8');

    // Update scheduler last run date if automatic
    if (type === 'Automatique') {
      const config = this.getScheduleConfig();
      config.lastRun = backupItem.createdAt;
      writeStorage('backup_schedule_config', config);
    }

    // Return friendly metadata
    const stat = fs.statSync(backupFile);
    return {
      id: backupId,
      name: backupItem.name,
      createdAt: backupItem.createdAt,
      type,
      size: stat.size,
      checksum,
      integrityStatus: 'Valide',
      recordCounts
    };
  }

  /**
   * List all stored backups with metadata and verification status
   */
  public async getBackupsList(): Promise<BackupMetadata[]> {
    if (!fs.existsSync(backupsDir)) return [];
    const files = fs.readdirSync(backupsDir);
    const list: BackupMetadata[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(backupsDir, file);
          const stat = fs.statSync(filePath);
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(rawData);

          // Perform light on-the-fly integrity verification check (does signature match?)
          const payloadString = JSON.stringify(data.payload, null, 2);
          const calculatedChecksum = crypto.createHash('sha256').update(payloadString).digest('hex');
          const isIntact = calculatedChecksum === data.checksum;

          list.push({
            id: data.id,
            name: data.name,
            createdAt: data.createdAt,
            type: data.type || 'Manuelle',
            size: stat.size,
            checksum: data.checksum || '',
            integrityStatus: isIntact ? 'Valide' : 'Corrompu',
            recordCounts: data.recordCounts || {
              companies: data.payload?.companies?.length || 0,
              branches: data.payload?.branches?.length || 0,
              users: data.payload?.users?.length || 0,
              customers: data.payload?.customers?.length || 0,
              products: data.payload?.products?.length || 0,
              invoices: data.payload?.invoices?.length || 0,
              suppliers: data.payload?.suppliers?.length || 0,
              inventory: data.payload?.inventory?.length || 0,
              auditLogs: data.payload?.auditLogs?.length || 0,
            }
          });
        } catch (e) {
          console.error('[BACKUP SERVICE] Failed loading backup metadata for:', file, e);
        }
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Verify integrity of a backup with a thorough check on-demand
   */
  public async verifyBackup(backupId: string): Promise<{
    id: string;
    intact: boolean;
    size: number;
    message: string;
    details: {
      hasPayload: boolean;
      checksumMatches: boolean;
      structureValid: boolean;
      expectedTablesChecked: string[];
    }
  }> {
    const backupFile = path.join(backupsDir, `${backupId}.json`);
    if (!fs.existsSync(backupFile)) {
      throw new Error('Fichier de sauvegarde introuvable.');
    }

    const stat = fs.statSync(backupFile);
    const rawData = fs.readFileSync(backupFile, 'utf-8');
    const data = JSON.parse(rawData);

    const payload = data.payload;
    const hasPayload = !!payload;

    // Recalculate checksum
    const payloadString = JSON.stringify(payload, null, 2);
    const calculatedChecksum = crypto.createHash('sha256').update(payloadString).digest('hex');
    const checksumMatches = calculatedChecksum === data.checksum;

    // Validate structure
    const tablesToCheck = [
      'companies',
      'branches',
      'users',
      'customers',
      'products',
      'invoices',
      'suppliers',
      'inventory',
      'auditLogs'
    ];

    let structureValid = true;
    if (payload) {
      for (const table of tablesToCheck) {
        if (!Array.isArray(payload[table])) {
          structureValid = false;
          break;
        }
      }
    } else {
      structureValid = false;
    }

    const intact = hasPayload && checksumMatches && structureValid;

    return {
      id: backupId,
      intact,
      size: stat.size,
      message: intact 
        ? 'L\'analyse n\'a détecté aucune anomalie. La signature de hachage SHA-255 est parfaitement intègre.'
        : 'Alerte ! Le fichier de sauvegarde est corrompu ou incomplet.',
      details: {
        hasPayload,
        checksumMatches,
        structureValid,
        expectedTablesChecked: tablesToCheck
      }
    };
  }

  /**
   * Restore a backup file to active local memory storage database
   */
  public async restoreBackup(backupId: string): Promise<boolean> {
    const backupFile = path.join(backupsDir, `${backupId}.json`);
    if (!fs.existsSync(backupFile)) {
      return false;
    }

    const rawData = fs.readFileSync(backupFile, 'utf-8');
    const data = JSON.parse(rawData);

    // Run verification first
    const verification = await this.verifyBackup(backupId);
    if (!verification.intact) {
      throw new Error('Impossible de restaurer une sauvegarde corrompue (échec de l\'intégrité checksum).');
    }

    const { companies, branches, users, customers, products, invoices, suppliers, inventory, auditLogs } = data.payload;

    if (companies) writeFallback('companies', companies);
    if (branches) writeFallback('branches', branches);
    if (users) writeFallback('users', users);
    if (customers) writeFallback('customers', customers);
    if (products) writeFallback('products', products);
    if (invoices) writeFallback('invoices', invoices);
    if (suppliers) writeFallback('suppliers', suppliers);
    if (inventory) writeFallback('inventory', inventory);
    if (auditLogs) writeFallback('audit_logs', auditLogs);

    return true;
  }
}

export const backupService = new BackupService();
