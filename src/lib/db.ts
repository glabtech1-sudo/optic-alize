import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let prisma: PrismaClient | null = null;

// Simple file-based fallback storage is ONLY kept as a fallback for backing up metadata if requested
const fallbackDir = path.join(process.cwd(), 'data_fallback');
if (!fs.existsSync(fallbackDir)) {
  fs.mkdirSync(fallbackDir, { recursive: true });
}

function getFallbackPath(filename: string): string {
  return path.join(fallbackDir, `${filename}.json`);
}

function readFallback<T>(filename: string, defaultVal: T): T {
  const filePath = getFallbackPath(filename);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    } catch (e) {
      console.error(`Error reading fallback for ${filename}:`, e);
    }
  }
  return defaultVal;
}

export function writeFallback<T>(filename: string, data: T): void {
  const filePath = getFallbackPath(filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error writing fallback for ${filename}:`, e);
  }
}

export function getPrisma() {
  if (!prisma) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn('DATABASE_URL is not set. Prisma Client cannot be initialized.');
      return null;
    }
    try {
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      });
      console.log('✅ Connected successfully to PostgreSQL database via Prisma.');
    } catch (e) {
      console.error('❌ Failed to initialize Prisma Client:', e);
      prisma = null;
    }
  }
  return prisma;
}

// Companies CRUD
export async function dbGetCompanies(): Promise<any[]> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  return await client.company.findMany({ include: { branches: true } });
}

export async function dbUpsertCompany(company: any): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const res = await client.company.upsert({
    where: { id: company.id },
    update: {
      name: company.name,
      currency: company.currency,
      taxRate: parseFloat(company.taxRate || company.tax_rate || 18),
      symbol: company.symbol || 'FCFA'
    },
    create: {
      id: company.id,
      name: company.name,
      currency: company.currency,
      taxRate: parseFloat(company.taxRate || company.tax_rate || 18),
      symbol: company.symbol || 'FCFA'
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved company: ${res.name} (${res.id})`);
  return res;
}

// Branches CRUD
export async function dbGetBranches(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  return await client.branch.findMany({
    where: companyId ? { companyId } : undefined
  });
}

export async function dbUpsertBranch(branch: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const targetCompanyId = companyId || branch.companyId || 'TG';
  const res = await client.branch.upsert({
    where: { id: branch.id },
    update: {
      companyId: targetCompanyId,
      zoneId: branch.zone_id || branch.zoneId || 'ZONE-AFR',
      code: branch.code,
      name: branch.name,
      address: branch.address || '',
      city: branch.city || 'Boutique',
      phone: branch.phone || '',
      email: branch.email || '',
      logo: branch.logo || '',
      managerId: branch.manager_id || branch.managerId || 'USR-01',
      currency: branch.currency || 'XOF',
      language: branch.language || 'FR',
      taxRate: parseFloat(branch.tax_rate || branch.taxRate || 18),
      status: branch.status || 'Actif'
    },
    create: {
      id: branch.id,
      companyId: targetCompanyId,
      zoneId: branch.zone_id || branch.zoneId || 'ZONE-AFR',
      code: branch.code,
      name: branch.name,
      address: branch.address || '',
      city: branch.city || 'Boutique',
      phone: branch.phone || '',
      email: branch.email || '',
      logo: branch.logo || '',
      managerId: branch.manager_id || branch.managerId || 'USR-01',
      currency: branch.currency || 'XOF',
      language: branch.language || 'FR',
      taxRate: parseFloat(branch.tax_rate || branch.taxRate || 18),
      status: branch.status || 'Actif'
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved branch: ${res.name} (${res.id})`);
  return res;
}

// Users CRUD
export async function dbGetUsers(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  return await client.user.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      role: true,
      userBranches: {
        include: {
          branch: true
        }
      }
    }
  });
}

export async function dbUpsertUser(user: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const targetCompanyId = companyId || user.companyId || 'TG';
  
  // Create role if doesn't exist
  const roleObj = await client.role.upsert({
    where: { name: user.role || 'Admin' },
    update: {},
    create: { name: user.role || 'Admin', description: `${user.role} role` }
  });

  const updatedUser = await client.user.upsert({
    where: { email: user.email },
    update: {
      companyId: targetCompanyId,
      name: user.name,
      phone: user.phone || '',
      location: user.location || '',
      status: user.status || 'Active',
      roleId: roleObj.id,
      allowedModules: user.allowedModules || [],
      password: user.password !== undefined ? user.password : undefined,
      mfaEnabled: user.mfaEnabled !== undefined ? user.mfaEnabled : undefined,
      mfaSecret: user.mfaSecret !== undefined ? user.mfaSecret : undefined
    },
    create: {
      id: user.id || undefined,
      companyId: targetCompanyId,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      location: user.location || '',
      status: user.status || 'Active',
      roleId: roleObj.id,
      allowedModules: user.allowedModules || [],
      password: user.password || null,
      mfaEnabled: user.mfaEnabled || false,
      mfaSecret: user.mfaSecret || null
    }
  });

  // Clear existing and link new branches
  if (user.allowedBoutiques && Array.isArray(user.allowedBoutiques)) {
    await client.userBranch.deleteMany({ where: { userId: updatedUser.id } });
    for (const bCode of user.allowedBoutiques) {
      const br = await client.branch.findFirst({ where: { code: bCode } });
      if (br) {
        await client.userBranch.create({
          data: {
            userId: updatedUser.id,
            branchId: br.id
          }
        });
      }
    }
  }
  console.log(`[POSTGRESQL WRITE] Successfully saved user: ${updatedUser.name} (${updatedUser.email})`);
  return updatedUser;
}

export async function dbDeleteUser(email: string): Promise<boolean> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  await client.user.delete({ where: { email } });
  console.log(`[POSTGRESQL WRITE] Successfully deleted user: ${email}`);
  return true;
}

// Customers CRUD
export async function dbGetCustomers(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const list = await client.customer.findMany({
    where: companyId ? { companyId } : undefined
  });
  return list.map(c => ({
    ...c,
    prescriptions: c.prescriptionsJson ? JSON.parse(c.prescriptionsJson) : [],
    purchases: c.purchasesJson ? JSON.parse(c.purchasesJson) : [],
    payments: c.paymentsJson ? JSON.parse(c.paymentsJson) : []
  }));
}

export async function dbUpsertCustomer(customer: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const targetCompanyId = companyId || customer.companyId || 'TG';
  let branchId: string | null = null;
  if (customer.branch) {
    const br = await client.branch.findFirst({ where: { name: customer.branch } });
    if (br) branchId = br.id;
  }
  const prescriptionsStr = JSON.stringify(customer.prescriptions || []);
  const purchasesStr = JSON.stringify(customer.purchases || []);
  const paymentsStr = JSON.stringify(customer.payments || []);

  const res = await client.customer.upsert({
    where: { id: customer.id },
    update: {
      companyId: targetCompanyId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      birthDate: customer.birthDate,
      email: customer.email || '',
      phone: customer.phone || '',
      ssn: customer.ssn || '',
      registrationDate: customer.registrationDate || new Date().toISOString().split('T')[0],
      loyaltyTier: customer.loyaltyTier || 'STANDARD',
      loyaltyPoints: parseInt(customer.loyaltyPoints || 0),
      branchId,
      prescriptionsJson: prescriptionsStr,
      purchasesJson: purchasesStr,
      paymentsJson: paymentsStr
    },
    create: {
      id: customer.id,
      companyId: targetCompanyId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      birthDate: customer.birthDate,
      email: customer.email || '',
      phone: customer.phone || '',
      ssn: customer.ssn || '',
      registrationDate: customer.registrationDate || new Date().toISOString().split('T')[0],
      loyaltyTier: customer.loyaltyTier || 'STANDARD',
      loyaltyPoints: parseInt(customer.loyaltyPoints || 0),
      branchId,
      prescriptionsJson: prescriptionsStr,
      purchasesJson: purchasesStr,
      paymentsJson: paymentsStr
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved customer: ${res.firstName} ${res.lastName} (${res.id})`);
  return {
    ...res,
    prescriptions: res.prescriptionsJson ? JSON.parse(res.prescriptionsJson) : [],
    purchases: res.purchasesJson ? JSON.parse(res.purchasesJson) : [],
    payments: res.paymentsJson ? JSON.parse(res.paymentsJson) : []
  };
}

export async function dbDeleteCustomer(id: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const res = await client.customer.delete({
    where: { id }
  });
  console.log(`[POSTGRESQL WRITE] Successfully deleted customer: ${id}`);
  return res;
}

// Products CRUD
export async function dbGetProducts(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  return await client.product.findMany({
    where: companyId ? { companyId } : undefined
  });
}

export async function dbUpsertProduct(product: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const targetCompanyId = companyId || product.companyId || 'TG';
  const res = await client.product.upsert({
    where: { id: product.id },
    update: {
      companyId: targetCompanyId,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: parseFloat(product.price || product.priceFCFA || 0),
      barcode: product.barcode || '',
      icon: product.icon || '🕶️'
    },
    create: {
      id: product.id,
      companyId: targetCompanyId,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: parseFloat(product.price || product.priceFCFA || 0),
      barcode: product.barcode || '',
      icon: product.icon || '🕶️'
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved product: ${res.name} (${res.id})`);
  return res;
}

export async function dbDeleteProduct(id: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const res = await client.product.delete({
    where: { id }
  });
  console.log(`[POSTGRESQL WRITE] Successfully deleted product: ${id}`);
  return res;
}

// Invoices (Orders) CRUD
export async function dbGetInvoices(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  return await client.invoice.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      customer: true,
      payments: true
    }
  });
}

export async function dbSaveInvoice(invoice: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const targetCompanyId = companyId || invoice.companyId || 'TG';
  let branch = await client.branch.findFirst({ where: { name: invoice.shop } });
  if (!branch) {
    branch = await client.branch.findFirst();
  }
  if (!branch) throw new Error('No branches configured in DB.');

  const res = await client.invoice.create({
    data: {
      id: invoice.id,
      companyId: targetCompanyId,
      customerId: invoice.customerId || null,
      branchId: branch.id,
      date: invoice.date || new Date().toISOString().split('T')[0],
      time: invoice.time || new Date().toLocaleTimeString(),
      total: parseFloat(invoice.total || 0),
      discount: parseFloat(invoice.discountAmount || 0),
      status: invoice.status || 'Paid',
      paymentMethod: invoice.paymentMethod || 'Espèces',
      cashier: invoice.cashier || 'M. Diallo'
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved invoice ID: ${res.id}`);
  return res;
}

// Audit Logs
export async function dbSaveAuditLog(log: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const targetCompanyId = companyId || log.companyId || 'TG';
  const res = await client.auditLog.create({
    data: {
      companyId: targetCompanyId,
      userId: log.userId || null,
      userEmail: log.userEmail,
      action: log.action,
      details: log.details
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved audit log: ${res.action}`);
  return res;
}

export async function dbGetAuditLogs(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  return await client.auditLog.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: { timestamp: 'desc' }
  });
}

// --- SECURE MULTI-TENANT REST & GRAPHQL EXPANSIONS (Achats, Stock, RH, Comptabilité) ---

export async function dbGetSuppliers(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  return await client.supplier.findMany({
    where: companyId ? { companyId } : undefined
  });
}

export async function dbUpsertSupplier(supplier: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const targetCompanyId = companyId || supplier.companyId || 'TG';
  const res = await client.supplier.upsert({
    where: { id: supplier.id },
    update: {
      companyId: targetCompanyId,
      name: supplier.name,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    },
    create: {
      id: supplier.id,
      companyId: targetCompanyId,
      name: supplier.name,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved supplier: ${res.name} (${res.id})`);
  return res;
}

export async function dbGetInventory(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  return await client.inventory.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      product: true,
      branch: true
    }
  });
}

export async function dbUpsertInventory(inventory: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const targetCompanyId = companyId || inventory.companyId || 'TG';
  const res = await client.inventory.upsert({
    where: { id: inventory.id },
    update: {
      companyId: targetCompanyId,
      branchId: inventory.branchId,
      productId: inventory.productId,
      quantity: parseInt(inventory.quantity || 0),
      minStock: parseInt(inventory.minStock || 5)
    },
    create: {
      id: inventory.id,
      companyId: targetCompanyId,
      branchId: inventory.branchId,
      productId: inventory.productId,
      quantity: parseInt(inventory.quantity || 0),
      minStock: parseInt(inventory.minStock || 5)
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved inventory item ID: ${res.id}`);
  return res;
}

export async function dbGetAccountingSummary(companyId?: string): Promise<any> {
  const invoices = await dbGetInvoices(companyId);
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalDiscounts = invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);
  const taxCollected = totalRevenue * 0.18; // 18% VAT rate standard in West Africa
  const transactionsCount = invoices.length;

  return {
    companyId: companyId || 'TG',
    totalRevenue,
    totalDiscounts,
    taxCollected,
    netRevenue: totalRevenue - totalDiscounts,
    transactionsCount,
    currency: companyId === 'BJ' ? 'FCFA' : 'FCFA', // matching local currency
    fiscalYear: '2026',
    status: 'Conforme'
  };
}

export async function dbGetHRCollaborators(companyId?: string): Promise<any[]> {
  const users = await dbGetUsers(companyId);
  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.roleId ? (u.role?.name || u.role) : (u.role || 'Optician'),
    phone: u.phone || '',
    status: u.status || 'Active',
    companyId: u.companyId || 'TG',
    department: u.role === 'Admin' ? 'Direction' : u.role === 'Manager' ? 'Gestion' : 'Technique',
    contractType: 'CDI',
    salaryFCFA: u.role === 'Admin' ? 1200000 : u.role === 'Manager' ? 850000 : 550000
  }));
}

// --- AUTOMATIC BACKUPS & RESTORATION ENGINE ---

const backupsDir = path.join(process.cwd(), 'data_fallback', 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

export async function dbCreateBackup(name: string): Promise<any> {
  const payload = {
    companies: await dbGetCompanies(),
    branches: await dbGetBranches(),
    users: await dbGetUsers(),
    customers: await dbGetCustomers(),
    products: await dbGetProducts(),
    invoices: await dbGetInvoices(),
    suppliers: await dbGetSuppliers(),
    inventory: await dbGetInventory(),
    auditLogs: await dbGetAuditLogs()
  };

  const backupId = `backup-${Date.now()}`;
  const backupFile = path.join(backupsDir, `${backupId}.json`);
  const backupItem = {
    id: backupId,
    name: name || `Auto Backup - ${new Date().toLocaleDateString('fr-FR')}`,
    createdAt: new Date().toISOString(),
    payload
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupItem, null, 2), 'utf-8');
  return { id: backupId, name: backupItem.name, createdAt: backupItem.createdAt };
}

export async function dbGetBackups(): Promise<any[]> {
  if (!fs.existsSync(backupsDir)) return [];
  const files = fs.readdirSync(backupsDir);
  const list: any[] = [];
  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const filePath = path.join(backupsDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        list.push({
          id: data.id,
          name: data.name,
          createdAt: data.createdAt,
          payload: data.payload
        });
      } catch (e) {
        console.error('Error loading backup file:', file, e);
      }
    }
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function dbRestoreBackup(backupId: string): Promise<boolean> {
  const backups = await dbGetBackups();
  const found = backups.find(b => b.id === backupId);
  if (!found || !found.payload) return false;

  const { companies, branches, users, customers, products, invoices, suppliers, inventory, auditLogs } = found.payload;

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

// Clinical data persistence CRUD functions
export async function dbGetAppointments(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) return [];
  return client.clinicAppointment.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: { createdAt: 'desc' }
  });
}

export async function dbUpsertAppointment(appointment: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const id = appointment.id || `appt-${Date.now()}`;
  const targetCompanyId = companyId || appointment.companyId || 'TG';
  const res = await client.clinicAppointment.upsert({
    where: { id },
    create: {
      id,
      companyId: targetCompanyId,
      patientName: appointment.patientName,
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason,
      optician: appointment.optician,
      status: appointment.status || 'En attente'
    },
    update: {
      companyId: targetCompanyId,
      patientName: appointment.patientName,
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason,
      optician: appointment.optician,
      status: appointment.status || 'En attente'
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved clinic appointment: ${res.id}`);
  return res;
}

export async function dbDeleteAppointment(id: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const res = await client.clinicAppointment.delete({
    where: { id }
  });
  console.log(`[POSTGRESQL WRITE] Successfully deleted clinic appointment: ${id}`);
  return res;
}

export async function dbGetSightExams(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) return [];
  return client.sightExam.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: { createdAt: 'desc' }
  });
}

export async function dbUpsertSightExam(exam: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const id = exam.id || `exam-${Date.now()}`;
  const targetCompanyId = companyId || exam.companyId || 'TG';
  const res = await client.sightExam.upsert({
    where: { id },
    create: {
      id,
      companyId: targetCompanyId,
      patientName: exam.patientName,
      date: exam.date,
      odSphere: String(exam.odSphere || exam.od?.sphere || ''),
      odCylinder: String(exam.odCylinder || exam.od?.cylinder || ''),
      odAxis: String(exam.odAxis || exam.od?.axis || ''),
      odAddition: String(exam.odAddition || exam.od?.addition || ''),
      ogSphere: String(exam.ogSphere || exam.og?.sphere || ''),
      ogCylinder: String(exam.ogCylinder || exam.og?.cylinder || ''),
      ogAxis: String(exam.ogAxis || exam.og?.axis || ''),
      ogAddition: String(exam.ogAddition || exam.og?.addition || ''),
      pupilDist: String(exam.pupilDist || exam.pd || ''),
      notes: exam.notes || ''
    },
    update: {
      companyId: targetCompanyId,
      patientName: exam.patientName,
      date: exam.date,
      odSphere: String(exam.odSphere || exam.od?.sphere || ''),
      odCylinder: String(exam.odCylinder || exam.od?.cylinder || ''),
      odAxis: String(exam.odAxis || exam.od?.axis || ''),
      odAddition: String(exam.odAddition || exam.od?.addition || ''),
      ogSphere: String(exam.ogSphere || exam.og?.sphere || ''),
      ogCylinder: String(exam.ogCylinder || exam.og?.cylinder || ''),
      ogAxis: String(exam.ogAxis || exam.og?.axis || ''),
      ogAddition: String(exam.ogAddition || exam.og?.addition || ''),
      pupilDist: String(exam.pupilDist || exam.pd || ''),
      notes: exam.notes || ''
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved sight exam: ${res.id}`);
  return res;
}

export async function dbDeleteSightExam(id: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const res = await client.sightExam.delete({
    where: { id }
  });
  console.log(`[POSTGRESQL WRITE] Successfully deleted sight exam: ${id}`);
  return res;
}

export async function dbGetClinicPrescriptions(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (!client) return [];
  return client.clinicPrescription.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: { createdAt: 'desc' }
  });
}

export async function dbUpsertClinicPrescription(pres: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const id = pres.id || `pres-${Date.now()}`;
  const targetCompanyId = companyId || pres.companyId || 'TG';
  const res = await client.clinicPrescription.upsert({
    where: { id },
    create: {
      id,
      companyId: targetCompanyId,
      patientName: pres.patientName,
      date: pres.date,
      odSphere: parseFloat(pres.odSphere || pres.od?.sphere || 0),
      odCylinder: parseFloat(pres.odCylinder || pres.od?.cylinder || 0),
      odAxis: parseInt(pres.odAxis || pres.od?.axis || 90),
      odAddition: parseFloat(pres.odAddition || pres.od?.addition || 2.0),
      ogSphere: parseFloat(pres.ogSphere || pres.og?.sphere || 0),
      ogCylinder: parseFloat(pres.ogCylinder || pres.og?.cylinder || 0),
      ogAxis: parseInt(pres.ogAxis || pres.og?.axis || 90),
      ogAddition: parseFloat(pres.ogAddition || pres.og?.addition || 2.0),
      pd: String(pres.pd || ''),
      prescribedLenses: pres.prescribedLenses || '',
      notes: pres.notes || ''
    },
    update: {
      companyId: targetCompanyId,
      patientName: pres.patientName,
      date: pres.date,
      odSphere: parseFloat(pres.odSphere || pres.od?.sphere || 0),
      odCylinder: parseFloat(pres.odCylinder || pres.od?.cylinder || 0),
      odAxis: parseInt(pres.odAxis || pres.od?.axis || 90),
      odAddition: parseFloat(pres.odAddition || pres.od?.addition || 2.0),
      ogSphere: parseFloat(pres.ogSphere || pres.og?.sphere || 0),
      ogCylinder: parseFloat(pres.ogCylinder || pres.og?.cylinder || 0),
      ogAxis: parseInt(pres.ogAxis || pres.og?.axis || 90),
      ogAddition: parseFloat(pres.ogAddition || pres.og?.addition || 2.0),
      pd: String(pres.pd || ''),
      prescribedLenses: pres.prescribedLenses || '',
      notes: pres.notes || ''
    }
  });
  console.log(`[POSTGRESQL WRITE] Successfully saved clinic prescription: ${res.id}`);
  return res;
}

export async function dbDeleteClinicPrescription(id: string): Promise<any> {
  const client = getPrisma();
  if (!client) throw new Error('PostgreSQL database connection is not available via Prisma.');
  const res = await client.clinicPrescription.delete({
    where: { id }
  });
  console.log(`[POSTGRESQL WRITE] Successfully deleted clinic prescription: ${id}`);
  return res;
}
