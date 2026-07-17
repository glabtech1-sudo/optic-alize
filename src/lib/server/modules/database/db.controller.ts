import { Router, Request, Response } from 'express';
import pg from 'pg';

const dbRouter = Router();

dbRouter.post('/database/create-table', async (req: Request, res: Response) => {
  const { tableName } = req.body;
  if (!tableName || typeof tableName !== 'string') {
    return res.status(400).json({ error: 'Table name is required and must be a string' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'DATABASE_URL environment variable is not configured' });
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check table name to avoid SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).json({ error: 'Invalid table name format' });
    }

    const queries: string[] = [];

    if (tableName === 'employees') {
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.employees (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            position TEXT NOT NULL,
            department TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            hire_date TEXT NOT NULL,
            basic_salary NUMERIC NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Actif',
            boutique TEXT NOT NULL,
            photo TEXT,
            pin_code TEXT,
            birth_date TEXT,
            id_card_number TEXT,
            contract_type TEXT,
            face_id_registered BOOLEAN DEFAULT false,
            liveness_proof BOOLEAN DEFAULT false,
            company_id TEXT DEFAULT 'TG',
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
    } else if (tableName === 'attendance') {
      // Ensure parent table exists
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.employees (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            position TEXT NOT NULL,
            department TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            hire_date TEXT NOT NULL,
            basic_salary NUMERIC NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Actif',
            boutique TEXT NOT NULL,
            photo TEXT,
            pin_code TEXT,
            birth_date TEXT,
            id_card_number TEXT,
            contract_type TEXT,
            face_id_registered BOOLEAN DEFAULT false,
            liveness_proof BOOLEAN DEFAULT false,
            company_id TEXT DEFAULT 'TG',
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.attendance (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
            employee_name TEXT,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            check_in_time TEXT,
            pause_time TEXT,
            reprise_time TEXT,
            check_out_time TEXT,
            notes TEXT,
            photo TEXT,
            boutique TEXT,
            gps_coords TEXT,
            facial_match_score NUMERIC,
            company_id TEXT DEFAULT 'TG',
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
    } else if (tableName === 'leaves') {
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.employees (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            position TEXT NOT NULL,
            department TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            hire_date TEXT NOT NULL,
            basic_salary NUMERIC NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Actif',
            boutique TEXT NOT NULL,
            photo TEXT,
            pin_code TEXT,
            birth_date TEXT,
            id_card_number TEXT,
            contract_type TEXT,
            face_id_registered BOOLEAN DEFAULT false,
            liveness_proof BOOLEAN DEFAULT false,
            company_id TEXT DEFAULT 'TG',
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.leaves (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
            employee_name TEXT,
            leave_type TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            days_count INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'En attente',
            reason TEXT,
            company_id TEXT DEFAULT 'TG',
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
    } else if (tableName === 'adjustments') {
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.employees (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            position TEXT NOT NULL,
            department TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            hire_date TEXT NOT NULL,
            basic_salary NUMERIC NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Actif',
            boutique TEXT NOT NULL,
            photo TEXT,
            pin_code TEXT,
            birth_date TEXT,
            id_card_number TEXT,
            contract_type TEXT,
            face_id_registered BOOLEAN DEFAULT false,
            liveness_proof BOOLEAN DEFAULT false,
            company_id TEXT DEFAULT 'TG',
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.adjustments (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
            employee_name TEXT,
            type TEXT NOT NULL,
            amount NUMERIC NOT NULL DEFAULT 0,
            date TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'En attente',
            company_id TEXT DEFAULT 'TG',
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
    } else if (tableName === 'payslips') {
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.employees (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            position TEXT NOT NULL,
            department TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            hire_date TEXT NOT NULL,
            basic_salary NUMERIC NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Actif',
            boutique TEXT NOT NULL,
            photo TEXT,
            pin_code TEXT,
            birth_date TEXT,
            id_card_number TEXT,
            contract_type TEXT,
            face_id_registered BOOLEAN DEFAULT false,
            liveness_proof BOOLEAN DEFAULT false,
            company_id TEXT DEFAULT 'TG',
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.payslips (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
            employee_name TEXT,
            employee_position TEXT,
            period TEXT NOT NULL,
            basic_salary NUMERIC NOT NULL DEFAULT 0,
            total_primes NUMERIC NOT NULL DEFAULT 0,
            total_avances NUMERIC NOT NULL DEFAULT 0,
            social_deductions NUMERIC NOT NULL DEFAULT 0,
            tax_deductions NUMERIC NOT NULL DEFAULT 0,
            net_salary NUMERIC NOT NULL DEFAULT 0,
            payment_status TEXT NOT NULL DEFAULT 'Brouillon',
            payment_date TEXT,
            presences_count INTEGER DEFAULT 0,
            absences_count INTEGER DEFAULT 0,
            loans_deduction NUMERIC DEFAULT 0,
            custom_primes NUMERIC DEFAULT 0,
            custom_withdrawals NUMERIC DEFAULT 0,
            company_id TEXT DEFAULT 'TG',
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
    } else if (tableName === 'users_profiles') {
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.users_profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL DEFAULT 'Viewer',
            status TEXT NOT NULL DEFAULT 'Active',
            phone TEXT,
            location TEXT,
            last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            allowed_boutiques TEXT[] DEFAULT '{}',
            allowed_modules TEXT[] DEFAULT '{}',
            company_id TEXT DEFAULT 'TG',
            data JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
    } else {
      queries.push(`
        CREATE TABLE IF NOT EXISTS public.${tableName} (
            id TEXT PRIMARY KEY,
            boutique_name TEXT NOT NULL DEFAULT 'Global',
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);
    }

    for (const q of queries) {
      await client.query(q);
    }

    console.log(`[DB AUTO-CREATE] Successfully created table: ${tableName}`);
    return res.json({ success: true, message: `Table ${tableName} created successfully.` });
  } catch (err: any) {
    console.error(`[DB AUTO-CREATE] Error creating table ${tableName}:`, err?.message || err);
    return res.status(500).json({ error: `Failed to create table ${tableName}: ${err?.message || err}` });
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
});

export default dbRouter;
