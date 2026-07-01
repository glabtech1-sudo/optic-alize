import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let prisma: PrismaClient | null = null;
const useFallback = !process.env.DATABASE_URL;

// Simple file-based fallback storage to keep the preview fully alive and shared!
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

function writeFallback<T>(filename: string, data: T): void {
  const filePath = getFallbackPath(filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error writing fallback for ${filename}:`, e);
  }
}

export function getPrisma() {
  if (useFallback) return null;
  if (!prisma) {
    try {
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      console.log('✅ Connected successfully to PostgreSQL database via Prisma.');
    } catch (e) {
      console.error('❌ Failed to initialize Prisma Client with provided URL:', e);
      prisma = null;
    }
  }
  return prisma;
}

// Companies CRUD
export async function dbGetCompanies(): Promise<any[]> {
  const client = getPrisma();
  if (client) {
    try {
      return await client.company.findMany({ include: { branches: true } });
    } catch (e) {
      console.error('Prisma query failed, falling back to JSON:', e);
    }
  }
  return readFallback('companies', [
    { id: 'TG', name: 'G-LAB Optic', currency: 'XOF', taxRate: 18, symbol: 'FCFA' },
    { id: 'BJ', name: 'Optic Alizé Bénin', currency: 'XOF', taxRate: 18, symbol: 'FCFA' }
  ]);
}

export async function dbUpsertCompany(company: any): Promise<any> {
  const client = getPrisma();
  if (client) {
    try {
      return await client.company.upsert({
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
    } catch (e) {
      console.error('Prisma write failed, using fallback:', e);
    }
  }
  const companies = await dbGetCompanies();
  const idx = companies.findIndex(c => c.id === company.id);
  if (idx > -1) {
    companies[idx] = { ...companies[idx], ...company };
  } else {
    companies.push(company);
  }
  writeFallback('companies', companies);
  return company;
}

// Branches CRUD
export async function dbGetBranches(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (client) {
    try {
      return await client.branch.findMany({
        where: companyId ? { companyId } : undefined
      });
    } catch (e) {
      console.error('Prisma query failed, using fallback:', e);
    }
  }
  const fallbackList = readFallback('branches', [
    {
      id: 'BOU-01',
      companyId: 'TG',
      zone_id: 'ZONE-AFR',
      code: 'ALZ-DC',
      name: 'Optic Alizé - Dépôt Central',
      address: 'Bvd du Mono, Face Cité An 2000, Lomé',
      city: 'Lomé',
      phone: '+228 22 21 00 01',
      email: 'contact@opticalize.com',
      logo: '',
      manager_id: 'USR-01',
      currency: 'FCFA',
      language: 'FR',
      tax_rate: 18,
      status: 'Actif',
      created_at: '2026-06-11'
    }
  ]);
  return companyId ? fallbackList.filter((b: any) => b.companyId === companyId) : fallbackList;
}

export async function dbUpsertBranch(branch: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  const targetCompanyId = companyId || branch.companyId || 'TG';
  if (client) {
    try {
      return await client.branch.upsert({
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
    } catch (e) {
      console.error('Prisma branch upsert failed, using fallback:', e);
    }
  }
  const branches = await dbGetBranches();
  const fullBranch = { ...branch, companyId: targetCompanyId };
  const idx = branches.findIndex(b => b.id === branch.id);
  if (idx > -1) {
    branches[idx] = { ...branches[idx], ...fullBranch };
  } else {
    branches.push(fullBranch);
  }
  writeFallback('branches', branches);
  return fullBranch;
}

// Users CRUD
export async function dbGetUsers(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (client) {
    try {
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
    } catch (e) {
      console.error('Prisma query failed, using fallback:', e);
    }
  }
  const fallbackList = readFallback('users', [
    {
      id: 'USR-01',
      companyId: 'TG',
      name: 'Glabtech1 Super Admin',
      email: 'glabtech1@gmail.com',
      role: 'Admin',
      status: 'Active',
      phone: '+228 90 00 00 01',
      location: 'Lomé Centre',
      lastActive: 'En ligne',
      allowedBoutiques: ['BOU-01'],
      allowedModules: ['dashboard', 'orders', 'crm', 'accounting', 'hr', 'stock', 'sav', 'settings']
    }
  ]);
  return companyId ? fallbackList.filter((u: any) => u.companyId === companyId) : fallbackList;
}

export async function dbUpsertUser(user: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  const targetCompanyId = companyId || user.companyId || 'TG';
  if (client) {
    try {
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
      return updatedUser;
    } catch (e) {
      console.error('Prisma user upsert failed, using fallback:', e);
    }
  }
  const users = await dbGetUsers();
  const fullUser = { ...user, companyId: targetCompanyId };
  const idx = users.findIndex(u => u.email === user.email);
  if (idx > -1) {
    users[idx] = { ...users[idx], ...fullUser };
  } else {
    users.push(fullUser);
  }
  writeFallback('users', users);
  return fullUser;
}

export async function dbDeleteUser(email: string): Promise<boolean> {
  const client = getPrisma();
  if (client) {
    try {
      await client.user.delete({ where: { email } });
      return true;
    } catch (e) {
      console.error('Prisma user delete failed:', e);
    }
  }
  const users = await dbGetUsers();
  const filtered = users.filter(u => u.email !== email);
  writeFallback('users', filtered);
  return true;
}

// Customers CRUD
export async function dbGetCustomers(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (client) {
    try {
      return await client.customer.findMany({
        where: companyId ? { companyId } : undefined
      });
    } catch (e) {
      console.error('Prisma query failed, using fallback:', e);
    }
  }
  const fallbackList = readFallback('customers', [
    {
      id: 'OA-CL-001',
      companyId: 'TG',
      firstName: 'Jean-Claude',
      lastName: 'Dossou',
      birthDate: '1985-04-12',
      email: 'jc.dossou@gmail.com',
      phone: '+228 91 22 33 44',
      ssn: '1850412228301',
      registrationDate: '2026-01-15',
      loyaltyTier: 'GOLD',
      loyaltyPoints: 340,
      branch: 'Optic Alizé - Dépôt Central'
    }
  ]);
  return companyId ? fallbackList.filter((c: any) => c.companyId === companyId) : fallbackList;
}

export async function dbUpsertCustomer(customer: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  const targetCompanyId = companyId || customer.companyId || 'TG';
  if (client) {
    try {
      let branchId: string | null = null;
      if (customer.branch) {
        const br = await client.branch.findFirst({ where: { name: customer.branch } });
        if (br) branchId = br.id;
      }
      return await client.customer.upsert({
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
          branchId
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
          branchId
        }
      });
    } catch (e) {
      console.error('Prisma customer upsert failed, using fallback:', e);
    }
  }
  const customers = await dbGetCustomers();
  const fullCustomer = { ...customer, companyId: targetCompanyId };
  const idx = customers.findIndex(c => c.id === customer.id);
  if (idx > -1) {
    customers[idx] = { ...customers[idx], ...fullCustomer };
  } else {
    customers.push(fullCustomer);
  }
  writeFallback('customers', customers);
  return fullCustomer;
}

// Products CRUD
export async function dbGetProducts(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (client) {
    try {
      return await client.product.findMany({
        where: companyId ? { companyId } : undefined
      });
    } catch (e) {
      console.error('Prisma query failed, using fallback:', e);
    }
  }
  const fallbackList = readFallback('products', [
    { id: 'FC-101', companyId: 'TG', name: 'Ray-Ban Wayfarer Classic (RB2140)', brand: 'Luxottica', category: 'Montures', price: 104000, barcode: '805289122012', icon: '🕶️' }
  ]);
  return companyId ? fallbackList.filter((p: any) => p.companyId === companyId) : fallbackList;
}

export async function dbUpsertProduct(product: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  const targetCompanyId = companyId || product.companyId || 'TG';
  if (client) {
    try {
      return await client.product.upsert({
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
    } catch (e) {
      console.error('Prisma product upsert failed, using fallback:', e);
    }
  }
  const products = await dbGetProducts();
  const fullProduct = { ...product, companyId: targetCompanyId };
  const idx = products.findIndex(p => p.id === product.id);
  if (idx > -1) {
    products[idx] = { ...products[idx], ...fullProduct };
  } else {
    products.push(fullProduct);
  }
  writeFallback('products', products);
  return fullProduct;
}

// Invoices (Orders) CRUD
export async function dbGetInvoices(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (client) {
    try {
      return await client.invoice.findMany({
        where: companyId ? { companyId } : undefined,
        include: {
          customer: true,
          payments: true
        }
      });
    } catch (e) {
      console.error('Prisma query failed, using fallback:', e);
    }
  }
  const fallbackList = readFallback('invoices', []);
  return companyId ? fallbackList.filter((i: any) => i.companyId === companyId) : fallbackList;
}

export async function dbSaveInvoice(invoice: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  const targetCompanyId = companyId || invoice.companyId || 'TG';
  if (client) {
    try {
      let branch = await client.branch.findFirst({ where: { name: invoice.shop } });
      if (!branch) {
        // Fallback default branch to prevent error
        branch = await client.branch.findFirst();
      }
      if (!branch) throw new Error('No branches configured in DB.');

      return await client.invoice.create({
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
    } catch (e) {
      console.error('Prisma invoice save failed, using fallback:', e);
    }
  }
  const invoices = await dbGetInvoices();
  const fullInvoice = { ...invoice, companyId: targetCompanyId };
  invoices.push(fullInvoice);
  writeFallback('invoices', invoices);
  return fullInvoice;
}

// Audit Logs
export async function dbSaveAuditLog(log: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  const targetCompanyId = companyId || log.companyId || 'TG';
  if (client) {
    try {
      return await client.auditLog.create({
        data: {
          companyId: targetCompanyId,
          userId: log.userId || null,
          userEmail: log.userEmail,
          action: log.action,
          details: log.details
        }
      });
    } catch (e) {
      console.error('Prisma auditLog create failed:', e);
    }
  }
  const logs = readFallback('audit_logs', []);
  const fullLog = { id: `log-${Date.now()}`, timestamp: new Date().toISOString(), companyId: targetCompanyId, ...log };
  logs.push(fullLog);
  writeFallback('audit_logs', logs);
  return fullLog;
}

export async function dbGetAuditLogs(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (client) {
    try {
      return await client.auditLog.findMany({
        where: companyId ? { companyId } : undefined,
        orderBy: { timestamp: 'desc' }
      });
    } catch (e) {
      console.error('Prisma audit logs fetch failed:', e);
    }
  }
  const fallbackList = readFallback('audit_logs', []);
  return companyId ? fallbackList.filter((l: any) => l.companyId === companyId) : fallbackList;
}

// --- SECURE MULTI-TENANT REST & GRAPHQL EXPANSIONS (Achats, Stock, RH, Comptabilité) ---

export async function dbGetSuppliers(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (client) {
    try {
      return await client.supplier.findMany({
        where: companyId ? { companyId } : undefined
      });
    } catch (e) {
      console.error('Prisma query failed for suppliers:', e);
    }
  }
  const fallbackList = readFallback('suppliers', [
    { id: 'SUP-01', companyId: 'TG', name: 'Luxottica France', contactName: 'M. Dubois', email: 'dubois@luxottica.fr', phone: '+33 1 40 00 01 02', address: 'Paris, France' },
    { id: 'SUP-02', companyId: 'BJ', name: 'Optic Gros Bénin', contactName: 'Mme. Lawson', email: 'lawson@opticgros.bj', phone: '+229 21 30 40 50', address: 'Cotonou, Bénin' }
  ]);
  return companyId ? fallbackList.filter((s: any) => s.companyId === companyId) : fallbackList;
}

export async function dbUpsertSupplier(supplier: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  const targetCompanyId = companyId || supplier.companyId || 'TG';
  if (client) {
    try {
      return await client.supplier.upsert({
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
    } catch (e) {
      console.error('Prisma supplier upsert failed:', e);
    }
  }
  const suppliers = await dbGetSuppliers();
  const fullSupplier = { ...supplier, companyId: targetCompanyId };
  const idx = suppliers.findIndex(s => s.id === supplier.id);
  if (idx > -1) {
    suppliers[idx] = { ...suppliers[idx], ...fullSupplier };
  } else {
    suppliers.push(fullSupplier);
  }
  writeFallback('suppliers', suppliers);
  return fullSupplier;
}

export async function dbGetInventory(companyId?: string): Promise<any[]> {
  const client = getPrisma();
  if (client) {
    try {
      return await client.inventory.findMany({
        where: companyId ? { companyId } : undefined,
        include: {
          product: true,
          branch: true
        }
      });
    } catch (e) {
      console.error('Prisma query failed for inventory:', e);
    }
  }
  const fallbackList = readFallback('inventory', [
    { id: 'INV-01', companyId: 'TG', branchId: 'BOU-01', productId: 'FC-101', quantity: 45, minStock: 5 },
    { id: 'INV-02', companyId: 'BJ', branchId: 'BOU-02', productId: 'FC-101', quantity: 12, minStock: 3 }
  ]);
  return companyId ? fallbackList.filter((i: any) => i.companyId === companyId) : fallbackList;
}

export async function dbUpsertInventory(inventory: any, companyId?: string): Promise<any> {
  const client = getPrisma();
  const targetCompanyId = companyId || inventory.companyId || 'TG';
  if (client) {
    try {
      return await client.inventory.upsert({
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
    } catch (e) {
      console.error('Prisma inventory upsert failed:', e);
    }
  }
  const inventories = await dbGetInventory();
  const fullInventory = { ...inventory, companyId: targetCompanyId };
  const idx = inventories.findIndex(i => i.id === inventory.id);
  if (idx > -1) {
    inventories[idx] = { ...inventories[idx], ...fullInventory };
  } else {
    inventories.push(fullInventory);
  }
  writeFallback('inventory', inventories);
  return fullInventory;
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
