import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requirePermission, enforceTenantIsolation, AuthenticatedRequest } from '../../core/tenant';
import { z } from 'zod';

const authRouter = Router();

// Initialize Admin Supabase client using Service Role Key
const envUrl = process.env.SUPABASE_URL || 'https://vgcarfflqjfbrevfnlyd.supabase.co';
const envServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = envServiceKey 
  ? createClient(envUrl, envServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

// Zod validation for user creation/update
const adminUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Nom complet requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères').optional(),
  role: z.string().min(1, 'Rôle requis'),
  status: z.enum(['Active', 'Suspended', 'Pending MFA', 'Invited']).default('Active'),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  allowedBoutiques: z.array(z.string()).optional().default([]),
  allowedModules: z.array(z.string()).optional().default([])
});

/**
 * GET /api/auth/users -> List all users from Supabase Auth + Profiles table
 */
authRouter.get(
  '/auth/users',
  authenticateToken as any,
  enforceTenantIsolation as any,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Client d'administration Supabase non configuré." });
      }

      // Fetch from users_profiles relational table
      const { data: profiles, error: profileErr } = await supabaseAdmin
        .from('users_profiles')
        .select('*');

      if (profileErr) {
        if (profileErr.code === '42P01' || profileErr.code === 'PGRST205' || profileErr.message?.includes('does not exist') || profileErr.message?.includes('schema cache')) {
          console.warn('[SUPABASE ADMIN] Table "users_profiles" does not exist yet. Please execute the migration sql schema script to configure your database tables. Falling back gracefully to auth list.');
        } else {
          console.warn('[SUPABASE ADMIN] Failed to fetch users_profiles table, fallback to auth list:', profileErr);
        }
      }

      // Fetch from Supabase Auth directly
      const { data: { users: authUsers }, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
      if (authErr) {
        return res.status(500).json({ error: "Impossible de lister les utilisateurs de Supabase Auth : " + authErr.message });
      }

      // Merge data
      const mergedUsers = authUsers.map((u) => {
        const prof = profiles?.find((p) => p.email.toLowerCase() === u.email?.toLowerCase());
        return {
          id: u.id,
          name: prof?.name || u.user_metadata?.name || u.email?.split('@')[0] || 'Utilisateur',
          email: u.email || '',
          role: prof?.role || u.user_metadata?.role || 'Viewer',
          status: prof?.status || (u.email_confirmed_at ? 'Active' : 'Invited'),
          phone: prof?.phone || u.phone || u.user_metadata?.phone || '',
          location: prof?.location || u.user_metadata?.location || 'Optic Alizé - Dépôt Central',
          lastActive: prof?.last_active || u.last_sign_in_at || 'Jamais',
          allowedBoutiques: prof?.allowed_boutiques || u.user_metadata?.allowed_boutiques || [],
          allowedModules: prof?.allowed_modules || u.user_metadata?.allowed_modules || []
        };
      });

      res.json({ success: true, users: mergedUsers });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/users -> Create or update a user exclusively in Supabase Auth + Profiles
 */
authRouter.post(
  '/auth/users',
  authenticateToken as any,
  enforceTenantIsolation as any,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Client d'administration Supabase non configuré." });
      }

      const payload = adminUserSchema.parse(req.body);
      const emailLower = payload.email.toLowerCase().trim();

      let targetUserId = payload.id;

      // Ensure the targetUserId is a valid Supabase UUID.
      // If it's a mock frontend ID (e.g., USR-0X), reset it to undefined to trigger creation or email lookup.
      const isUuid = targetUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);
      if (!isUuid) {
        targetUserId = undefined;
      }

      // 1. If ID doesn't exist, check if email already exists in Supabase Auth
      if (!targetUserId) {
        const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
        if (!listErr && users) {
          const existing = users.find((u: any) => u.email?.toLowerCase() === emailLower);
          if (existing) {
            targetUserId = existing.id;
          }
        }
      }

      if (targetUserId) {
        // UPDATE EXISTING USER
        console.log(`[SUPABASE ADMIN] Updating user: ${emailLower} (${targetUserId})`);
        
        const updateParams: any = {
          user_metadata: {
            name: payload.name,
            role: payload.role,
            location: payload.location,
            phone: payload.phone,
            allowed_boutiques: payload.allowedBoutiques,
            allowed_modules: payload.allowedModules
          }
        };

        if (payload.password) {
          updateParams.password = payload.password;
        }

        const { error: authUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          updateParams
        );

        if (authUpdateErr) {
          return res.status(400).json({ error: "Erreur de mise à jour Supabase Auth : " + authUpdateErr.message });
        }

        // Update Profiles table
        const { error: profUpdateErr } = await supabaseAdmin
          .from('users_profiles')
          .upsert({
            id: targetUserId,
            name: payload.name,
            email: emailLower,
            role: payload.role,
            status: payload.status,
            phone: payload.phone,
            location: payload.location,
            allowed_boutiques: payload.allowedBoutiques,
            allowed_modules: payload.allowedModules,
            last_active: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profUpdateErr) {
          console.error('[SUPABASE ADMIN] Profile update table error:', profUpdateErr);
        }

      } else {
        // CREATE NEW USER
        console.log(`[SUPABASE ADMIN] Creating user: ${emailLower}`);

        if (!payload.password) {
          return res.status(400).json({ error: "Le mot de passe est obligatoire pour la création d'un utilisateur." });
        }

        const { data: newUser, error: authCreateErr } = await supabaseAdmin.auth.admin.createUser({
          email: emailLower,
          password: payload.password,
          email_confirm: true,
          user_metadata: {
            name: payload.name,
            role: payload.role,
            location: payload.location,
            phone: payload.phone,
            allowed_boutiques: payload.allowedBoutiques,
            allowed_modules: payload.allowedModules
          }
        });

        if (authCreateErr || !newUser.user) {
          return res.status(400).json({ error: "Erreur d'enregistrement Supabase Auth : " + authCreateErr?.message });
        }

        targetUserId = newUser.user.id;

        // Populate users_profiles table directly to ensure instant sync
        const { error: profInsertErr } = await supabaseAdmin
          .from('users_profiles')
          .insert({
            id: targetUserId,
            name: payload.name,
            email: emailLower,
            role: payload.role,
            status: payload.status,
            phone: payload.phone,
            location: payload.location,
            allowed_boutiques: payload.allowedBoutiques,
            allowed_modules: payload.allowedModules
          });

        if (profInsertErr) {
          console.error('[SUPABASE ADMIN] Profile insert table error:', profInsertErr);
        }
      }

      res.json({
        success: true,
        message: 'Utilisateur enregistré avec succès dans Supabase Auth.',
        user: {
          id: targetUserId,
          name: payload.name,
          email: emailLower,
          role: payload.role,
          status: payload.status,
          phone: payload.phone,
          location: payload.location,
          allowedBoutiques: payload.allowedBoutiques,
          allowedModules: payload.allowedModules
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/auth/users/:id -> Delete a user from Supabase Auth + Profiles
 */
authRouter.delete(
  '/auth/users/:id',
  authenticateToken as any,
  requirePermission('delete:users') as any,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Client d'administration Supabase non configuré." });
      }

      const targetId = req.params.id;
      console.log(`[SUPABASE ADMIN] Deleting user ID: ${targetId}`);

      // Delete from Profiles first (due to potentially triggered/cascade references)
      await supabaseAdmin.from('users_profiles').delete().eq('id', targetId);

      // Delete from Supabase Auth
      const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetId);
      if (authDeleteErr) {
        return res.status(400).json({ error: "Erreur de suppression dans Supabase Auth : " + authDeleteErr.message });
      }

      res.json({ success: true, message: 'Utilisateur supprimé définitivement de Supabase Auth.' });
    } catch (err) {
      next(err);
    }
  }
);

export default authRouter;
