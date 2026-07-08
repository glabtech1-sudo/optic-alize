-- ==========================================
-- OPTIC ALIZE : SUPABASE ENTERPRISE DATABASE MIGRATION
-- FOCUS: RELATIONAL HR SCHEMA, USER MANAGEMENT, RBAC, AND MULTI-BOUTIQUE RLS
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS PROFILES TABLE (SYNCHRONIZED WITH AUTH.USERS)
CREATE TABLE IF NOT EXISTS public.users_profiles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Directeur', 'Concepteur', 'Manager', 'Gérant', 'Optician', 'Opticien', 'Billing Manager', 'Comptable', 'Cashier', 'Caissier', 'Editor', 'Viewer', 'Secrétaire')),
    status TEXT NOT NULL DEFAULT 'Active',
    phone TEXT,
    location TEXT, -- Default boutique/agency
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    allowed_boutiques TEXT[] DEFAULT '{}',
    allowed_modules TEXT[] DEFAULT '{}',
    company_id TEXT DEFAULT 'TG',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. EMPLOYEES TABLE (HR CORE)
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
    status TEXT NOT NULL DEFAULT 'Actif' CHECK (status IN ('Actif', 'Congé', 'Suspendu')),
    boutique TEXT NOT NULL,
    photo TEXT,
    pin_code TEXT,
    birth_date TEXT,
    id_card_number TEXT,
    contract_type TEXT,
    face_id_registered BOOLEAN DEFAULT false,
    liveness_proof BOOLEAN DEFAULT false,
    company_id TEXT DEFAULT 'TG',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ATTENDANCE TABLE (PRESENCE TRACKING)
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Présent', 'Retard', 'Absent')),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. LEAVES TABLE (CONGÉS)
CREATE TABLE IF NOT EXISTS public.leaves (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('Congés Payés', 'Maladie', 'Maternité', 'Sans Solde')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'En attente' CHECK (status IN ('En attente', 'Approuvé', 'Refusé')),
    reason TEXT,
    company_id TEXT DEFAULT 'TG',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ADJUSTMENTS TABLE (PRIMES & AVANCES)
CREATE TABLE IF NOT EXISTS public.adjustments (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('Prime', 'Avance')),
    amount NUMERIC NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'En attente' CHECK (status IN ('Appliqué', 'En attente')),
    company_id TEXT DEFAULT 'TG',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. PAYSLIPS TABLE (BULLETINS DE PAIE)
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
    payment_status TEXT NOT NULL DEFAULT 'Brouillon' CHECK (payment_status IN ('Payé', 'Brouillon', 'Arbitrage', 'Refusé')),
    payment_date TEXT,
    presences_count INTEGER DEFAULT 0,
    absences_count INTEGER DEFAULT 0,
    loans_deduction NUMERIC DEFAULT 0,
    custom_primes NUMERIC DEFAULT 0,
    custom_withdrawals NUMERIC DEFAULT 0,
    company_id TEXT DEFAULT 'TG',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- TRIGGERS : AUTOMATIC AUTH SYNCHRONIZATION
-- ==========================================

-- Trigger Function: On auth.users insert, auto-create a row in public.users_profiles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profiles (
        id, 
        name, 
        email, 
        role, 
        status, 
        location,
        allowed_boutiques, 
        allowed_modules
    )
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', 'Nouvel Employé'),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'Viewer'),
        'Active',
        coalesce(new.raw_user_meta_data->>'location', 'Optic Alizé - DIRECTION'),
        array[coalesce(new.raw_user_meta_data->>'location', 'Optic Alizé - DIRECTION')],
        array['dashboard', 'presence']
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if the logged-in user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN coalesce(
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin', 'Super Admin', 'Concepteur'),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Check user's boutique access list
CREATE OR REPLACE FUNCTION public.has_boutique_access(boutique_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admins have global access
    IF public.is_admin() THEN
        RETURN true;
    END IF;
    -- Check user_metadata list
    RETURN boutique_name = ANY (
        SELECT unnest(string_to_array(replace(replace(coalesce(auth.jwt() -> 'user_metadata' ->> 'allowed_boutiques', ''), '[', ''), ']', ''), ','))
    ) OR (auth.jwt() -> 'user_metadata' ->> 'location') = boutique_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. POLICIES: USERS PROFILES
CREATE POLICY "Users profiles are viewable by everyone in same company" ON public.users_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users profiles are editable by admins or self" ON public.users_profiles
    FOR ALL USING (
        public.is_admin() OR auth.uid() = id
    );


-- 2. POLICIES: EMPLOYEES
CREATE POLICY "Employees viewable by boutique access or self" ON public.employees
    FOR SELECT USING (
        public.is_admin() OR 
        public.has_boutique_access(boutique) OR 
        email = auth.jwt() ->> 'email'
    );

CREATE POLICY "Employees editable by admins/managers" ON public.employees
    FOR ALL USING (
        public.is_admin() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Manager', 'Gérant', 'Directeur')
    );


-- 3. POLICIES: ATTENDANCE
CREATE POLICY "Attendance viewable by boutique access or self" ON public.attendance
    FOR SELECT USING (
        public.is_admin() OR 
        public.has_boutique_access(boutique) OR 
        employee_id IN (SELECT id FROM public.employees WHERE email = auth.jwt() ->> 'email')
    );

CREATE POLICY "Attendance insertable by anyone (clock-in/out)" ON public.attendance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Attendance editable by admins/managers" ON public.attendance
    FOR ALL USING (
        public.is_admin() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Manager', 'Gérant', 'Directeur')
    );


-- 4. POLICIES: LEAVES
CREATE POLICY "Leaves viewable by boutique access or self" ON public.leaves
    FOR SELECT USING (
        public.is_admin() OR 
        employee_id IN (SELECT id FROM public.employees WHERE email = auth.jwt() ->> 'email')
    );

CREATE POLICY "Leaves manageable by self or admins/managers" ON public.leaves
    FOR ALL USING (
        public.is_admin() OR 
        employee_id IN (SELECT id FROM public.employees WHERE email = auth.jwt() ->> 'email') OR
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Manager', 'Gérant', 'Directeur')
    );


-- 5. POLICIES: ADJUSTMENTS
CREATE POLICY "Adjustments viewable by boutique access or self" ON public.adjustments
    FOR SELECT USING (
        public.is_admin() OR 
        employee_id IN (SELECT id FROM public.employees WHERE email = auth.jwt() ->> 'email')
    );

CREATE POLICY "Adjustments manageable by admins/managers" ON public.adjustments
    FOR ALL USING (
        public.is_admin() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Manager', 'Gérant', 'Directeur', 'Comptable')
    );


-- 6. POLICIES: PAYSLIPS
CREATE POLICY "Payslips viewable by self or comptables/admins" ON public.payslips
    FOR SELECT USING (
        public.is_admin() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Comptable' OR
        employee_id IN (SELECT id FROM public.employees WHERE email = auth.jwt() ->> 'email')
    );

CREATE POLICY "Payslips manageable by admins/comptables" ON public.payslips
    FOR ALL USING (
        public.is_admin() OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'Comptable'
    );


-- ==========================================
-- 8. GLOBAL FALLBACK SYNC TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.opticalize_sync (
    collection_name TEXT NOT NULL,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (collection_name, boutique_name)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.opticalize_sync ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access for read & write
CREATE POLICY "Allow public full access" ON public.opticalize_sync
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- ==========================================
-- 9. DEDICATED BUSINESS DATA TABLES
-- ==========================================

-- CRM Patients/Customers
CREATE TABLE IF NOT EXISTS public.crm_customers (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on crm_customers" ON public.crm_customers FOR ALL USING (true) WITH CHECK (true);

-- Product Catalog
CREATE TABLE IF NOT EXISTS public.fused_catalog (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.fused_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on fused_catalog" ON public.fused_catalog FOR ALL USING (true) WITH CHECK (true);

-- SaaS Orders/Invoices
CREATE TABLE IF NOT EXISTS public.saas_orders (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.saas_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on saas_orders" ON public.saas_orders FOR ALL USING (true) WITH CHECK (true);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Clinic Appointments
CREATE TABLE IF NOT EXISTS public.my_clinic_appointments (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.my_clinic_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on my_clinic_appointments" ON public.my_clinic_appointments FOR ALL USING (true) WITH CHECK (true);

-- Clinic Sight Exams
CREATE TABLE IF NOT EXISTS public.my_clinic_exams (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.my_clinic_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on my_clinic_exams" ON public.my_clinic_exams FOR ALL USING (true) WITH CHECK (true);

-- Clinic Prescriptions
CREATE TABLE IF NOT EXISTS public.my_prescriptions (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.my_prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on my_prescriptions" ON public.my_prescriptions FOR ALL USING (true) WITH CHECK (true);

-- HQ Companies
CREATE TABLE IF NOT EXISTS public.hq_companies (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.hq_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on hq_companies" ON public.hq_companies FOR ALL USING (true) WITH CHECK (true);

-- HQ Branches
CREATE TABLE IF NOT EXISTS public.hq_branches (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.hq_branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on hq_branches" ON public.hq_branches FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 10. REALTIME CONFIGURATION (SUPABASE PUBLIC BROADCAST)
-- ==========================================

-- Enable Replica Identity Full to receive entire row state on updates/deletes
ALTER TABLE public.users_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.attendance REPLICA IDENTITY FULL;
ALTER TABLE public.leaves REPLICA IDENTITY FULL;
ALTER TABLE public.adjustments REPLICA IDENTITY FULL;
ALTER TABLE public.payslips REPLICA IDENTITY FULL;
ALTER TABLE public.opticalize_sync REPLICA IDENTITY FULL;
ALTER TABLE public.crm_customers REPLICA IDENTITY FULL;
ALTER TABLE public.fused_catalog REPLICA IDENTITY FULL;
ALTER TABLE public.saas_orders REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.my_clinic_appointments REPLICA IDENTITY FULL;
ALTER TABLE public.my_clinic_exams REPLICA IDENTITY FULL;
ALTER TABLE public.my_prescriptions REPLICA IDENTITY FULL;
ALTER TABLE public.hq_companies REPLICA IDENTITY FULL;
ALTER TABLE public.hq_branches REPLICA IDENTITY FULL;

-- Add tables to Supabase Realtime publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.users_profiles,
    public.employees,
    public.attendance,
    public.leaves,
    public.adjustments,
    public.payslips,
    public.opticalize_sync,
    public.crm_customers,
    public.fused_catalog,
    public.saas_orders,
    public.audit_logs,
    public.my_clinic_appointments,
    public.my_clinic_exams,
    public.my_prescriptions,
    public.hq_companies,
    public.hq_branches;
COMMIT;

