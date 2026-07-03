import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const loginSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string().min(4, 'Mot de passe trop court')
});

export const customerSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  birthDate: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  branch: z.string().optional()
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nom du produit requis'),
  brand: z.string(),
  category: z.string(),
  price: z.number().positive('Le prix doit être positif'),
  barcode: z.string().optional()
});

export const supplierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nom du fournisseur requis'),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional()
});

export const inventorySchema = z.object({
  id: z.string(),
  branchId: z.string(),
  productId: z.string(),
  quantity: z.union([z.number(), z.string()]),
  minStock: z.union([z.number(), z.string()]).optional()
});

export const invoiceSchema = z.object({
  id: z.string(),
  customerId: z.string().optional().nullable(),
  shop: z.string(),
  total: z.number(),
  items: z.array(z.any()).optional()
});

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Échec de validation des données',
        details: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    req.body = result.data;
    next();
  };
}
