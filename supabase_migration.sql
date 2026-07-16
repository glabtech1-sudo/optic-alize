-- ==========================================
-- G-LAB OPTIC & OPTIC ALIZE : ENTERPRISE POSTGRESQL SCHEMA
-- COMPATIBLE WITH SUPABASE & INTEGRATED CLOUD SYNC ENGINE
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- MODULE : UTILISATEURS, RÔLES & PERMISSIONS
-- ==========================================

-- Users profiles table
CREATE TABLE IF NOT EXISTS public.users_profiles (
    id TEXT PRIMARY KEY,
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
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    module TEXT NOT NULL
);

-- ==========================================
-- MODULE : BOUTIQUES & AGENCES
-- ==========================================

-- HQ Companies
CREATE TABLE IF NOT EXISTS public.hq_companies (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- HQ Branches (Boutiques)
CREATE TABLE IF NOT EXISTS public.hq_branches (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Zones (Agences / Zones géographiques)
CREATE TABLE IF NOT EXISTS public.zones (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- HQ Branch Modules (Modules par boutique)
CREATE TABLE IF NOT EXISTS public.hq_branch_modules (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- MODULE : RESSOURCES HUMAINES (RH)
-- ==========================================

-- Employees
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
    status TEXT NOT NULL DEFAULT 'Actif' CHECK (status IN ('Actif', 'Congé', 'Suspendu', 'ACTIVE')),
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

-- Attendance (Pointages)
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Présent', 'Retard', 'Absent', 'PRESENT', 'LATE', 'ABSENT')),
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

-- Leaves (Congés)
CREATE TABLE IF NOT EXISTS public.leaves (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT,
    leave_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'En attente' CHECK (status IN ('En attente', 'Approuvé', 'Refusé', 'PENDING', 'APPROVED', 'REJECTED')),
    reason TEXT,
    company_id TEXT DEFAULT 'TG',
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adjustments (Primes & Avances)
CREATE TABLE IF NOT EXISTS public.adjustments (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('Prime', 'Avance')),
    amount NUMERIC NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'En attente' CHECK (status IN ('Appliqué', 'En attente', 'APPLIED', 'PENDING')),
    company_id TEXT DEFAULT 'TG',
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Payslips (Bulletins de paie)
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
    payment_status TEXT NOT NULL DEFAULT 'Brouillon' CHECK (payment_status IN ('Payé', 'Brouillon', 'Arbitrage', 'Refusé', 'PAID', 'DRAFT', 'REJECTED')),
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

-- ==========================================
-- MODULES : CRM, PATIENTS, CLIENTS & CLINIQUE
-- ==========================================

-- CRM Patients
CREATE TABLE IF NOT EXISTS public.crm_customers (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Backward Compatibility Customers list
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Appointments (Rendez-vous Clinique)
CREATE TABLE IF NOT EXISTS public.my_clinic_appointments (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sight Exams (Examens de vue)
CREATE TABLE IF NOT EXISTS public.my_clinic_exams (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Prescriptions (Ordonnances)
CREATE TABLE IF NOT EXISTS public.my_prescriptions (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- MODULES : PRODUITS & STOCK
-- ==========================================

-- Fused Product Catalog
CREATE TABLE IF NOT EXISTS public.fused_catalog (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Backward Compatibility Products list
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Stock items
CREATE TABLE IF NOT EXISTS public.stock_items (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Stock movement log / history
CREATE TABLE IF NOT EXISTS public.stock_history (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Compatibility Inventory list
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- MODULES : LOGISTIQUE, ACHATS, FOURNISSEURS & COMMANDES
-- ==========================================

-- Suppliers (Fournisseurs)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Logistical Commands (Commandes boutiques)
CREATE TABLE IF NOT EXISTS public.my_commandes (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- HQ Pending Purchase Orders
CREATE TABLE IF NOT EXISTS public.hq_pending_orders (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- MODULES : VENTES, POS, FACTURATION & SAV
-- ==========================================

-- Sales & Billing (Commandes SaaS & Ventes)
CREATE TABLE IF NOT EXISTS public.saas_orders (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Invoices (Factures dématérialisées)
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Vouchers & Bons d'achats
CREATE TABLE IF NOT EXISTS public.vouchers_list (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Claims / SAV Management
CREATE TABLE IF NOT EXISTS public.sav_claims (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- MODULE : COMPTABILITÉ
-- ==========================================

-- Revenues (Recettes)
CREATE TABLE IF NOT EXISTS public.accounting_revenues (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Expenses (Dépenses / Charges d'exploitation)
CREATE TABLE IF NOT EXISTS public.accounting_expenses (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mobile Money ledger (Wave / Orange Money / Moov / MTN)
CREATE TABLE IF NOT EXISTS public.accounting_mobile_money (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- MODULES : AUDIT, NOTIFICATIONS & BACKUPS
-- ==========================================

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Push Notifications Logs
CREATE TABLE IF NOT EXISTS public.push_logs (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- System Backups list
CREATE TABLE IF NOT EXISTS public.backups_list (
    id TEXT PRIMARY KEY,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- MODULE : SYSTEME DE CLONAGE & SYNCHRONISATION FALLBACK
-- ==========================================

-- Fallback Sync Central Table
CREATE TABLE IF NOT EXISTS public.opticalize_sync (
    collection_name TEXT NOT NULL,
    boutique_name TEXT NOT NULL DEFAULT 'Global',
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (collection_name, boutique_name)
);

-- ==========================================
-- AUTOMATIC SYNC TRIGGERS : DATABASE TRANSFORMATION FROM JSONB TO COLUMNS
-- ==========================================

-- Trigger Function: Employees
CREATE OR REPLACE FUNCTION public.sync_employees_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data IS NOT NULL AND NEW.data ? 'value' THEN
        NEW.first_name := COALESCE(NEW.data->'value'->>'firstName', NEW.data->'value'->>'first_name', NEW.first_name, '');
        NEW.last_name := COALESCE(NEW.data->'value'->>'lastName', NEW.data->'value'->>'last_name', NEW.last_name, '');
        NEW.position := COALESCE(NEW.data->'value'->>'position', NEW.position, '');
        NEW.department := COALESCE(NEW.data->'value'->>'department', NEW.department, '');
        NEW.email := COALESCE(NEW.data->'value'->>'email', NEW.email, '');
        NEW.phone := COALESCE(NEW.data->'value'->>'phone', NEW.phone, '');
        NEW.hire_date := COALESCE(NEW.data->'value'->>'hireDate', NEW.data->'value'->>'hire_date', NEW.hire_date, '');
        NEW.basic_salary := COALESCE((NEW.data->'value'->>'basicSalary')::numeric, (NEW.data->'value'->>'basic_salary')::numeric, NEW.basic_salary, 0);
        NEW.status := COALESCE(NEW.data->'value'->>'status', NEW.status, 'Actif');
        NEW.boutique := COALESCE(NEW.data->'value'->>'boutique', NEW.boutique, NEW.boutique_name, 'Global');
        NEW.photo := COALESCE(NEW.data->'value'->>'photo', NEW.photo);
        NEW.pin_code := COALESCE(NEW.data->'value'->>'pinCode', NEW.data->'value'->>'pin_code', NEW.pin_code);
        NEW.birth_date := COALESCE(NEW.data->'value'->>'birthDate', NEW.data->'value'->>'birth_date', NEW.birth_date);
        NEW.id_card_number := COALESCE(NEW.data->'value'->>'idCardNumber', NEW.data->'value'->>'id_card_number', NEW.id_card_number);
        NEW.contract_type := COALESCE(NEW.data->'value'->>'contractType', NEW.data->'value'->>'contract_type', NEW.contract_type);
        NEW.face_id_registered := COALESCE((NEW.data->'value'->>'faceIdRegistered')::boolean, (NEW.data->'value'->>'face_id_registered')::boolean, NEW.face_id_registered, false);
        NEW.liveness_proof := COALESCE((NEW.data->'value'->>'livenessProof')::boolean, (NEW.data->'value'->>'liveness_proof')::boolean, NEW.liveness_proof, false);
        NEW.company_id := COALESCE(NEW.data->'value'->>'companyId', NEW.data->'value'->>'company_id', NEW.company_id, 'TG');
    ELSIF NEW.data IS NULL OR jsonb_typeof(NEW.data) = 'null' OR NEW.data = '{}'::jsonb THEN
        NEW.data := jsonb_build_object('value', jsonb_build_object(
            'id', NEW.id,
            'firstName', NEW.first_name,
            'lastName', NEW.last_name,
            'position', NEW.position,
            'department', NEW.department,
            'email', NEW.email,
            'phone', NEW.phone,
            'hireDate', NEW.hire_date,
            'basicSalary', NEW.basic_salary,
            'status', NEW.status,
            'boutique', NEW.boutique,
            'photo', NEW.photo,
            'pinCode', NEW.pin_code,
            'birthDate', NEW.birth_date,
            'idCardNumber', NEW.id_card_number,
            'contractType', NEW.contract_type,
            'faceIdRegistered', NEW.face_id_registered,
            'livenessProof', NEW.liveness_proof,
            'companyId', NEW.company_id
        ));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_employees ON public.employees;
CREATE TRIGGER trg_sync_employees
    BEFORE INSERT OR UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.sync_employees_columns();

-- Trigger Function: Attendance
CREATE OR REPLACE FUNCTION public.sync_attendance_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data IS NOT NULL AND NEW.data ? 'value' THEN
        NEW.employee_id := COALESCE(NEW.data->'value'->>'employeeId', NEW.data->'value'->>'employee_id', NEW.employee_id);
        NEW.employee_name := COALESCE(NEW.data->'value'->>'employeeName', NEW.data->'value'->>'employee_name', NEW.employee_name);
        NEW.date := COALESCE(NEW.data->'value'->>'date', NEW.date);
        NEW.status := COALESCE(NEW.data->'value'->>'status', NEW.status);
        NEW.check_in_time := COALESCE(NEW.data->'value'->>'checkInTime', NEW.data->'value'->>'check_in_time', NEW.check_in_time);
        NEW.pause_time := COALESCE(NEW.data->'value'->>'pauseTime', NEW.data->'value'->>'pause_time', NEW.pause_time);
        NEW.reprise_time := COALESCE(NEW.data->'value'->>'repriseTime', NEW.data->'value'->>'reprise_time', NEW.reprise_time);
        NEW.check_out_time := COALESCE(NEW.data->'value'->>'checkOutTime', NEW.data->'value'->>'check_out_time', NEW.check_out_time);
        NEW.notes := COALESCE(NEW.data->'value'->>'notes', NEW.notes);
        NEW.photo := COALESCE(NEW.data->'value'->>'photo', NEW.photo);
        NEW.boutique := COALESCE(NEW.data->'value'->>'boutique', NEW.boutique, NEW.boutique_name);
        NEW.gps_coords := COALESCE(NEW.data->'value'->>'gpsCoords', NEW.data->'value'->>'gps_coords', NEW.gps_coords);
        NEW.facial_match_score := COALESCE((NEW.data->'value'->>'facialMatchScore')::numeric, (NEW.data->'value'->>'facial_match_score')::numeric, NEW.facial_match_score);
        NEW.company_id := COALESCE(NEW.data->'value'->>'companyId', NEW.data->'value'->>'company_id', NEW.company_id, 'TG');
    ELSIF NEW.data IS NULL OR jsonb_typeof(NEW.data) = 'null' OR NEW.data = '{}'::jsonb THEN
        NEW.data := jsonb_build_object('value', jsonb_build_object(
            'id', NEW.id,
            'employeeId', NEW.employee_id,
            'employeeName', NEW.employee_name,
            'date', NEW.date,
            'status', NEW.status,
            'checkInTime', NEW.check_in_time,
            'pauseTime', NEW.pause_time,
            'repriseTime', NEW.reprise_time,
            'checkOutTime', NEW.check_out_time,
            'notes', NEW.notes,
            'photo', NEW.photo,
            'boutique', NEW.boutique,
            'gpsCoords', NEW.gps_coords,
            'facialMatchScore', NEW.facial_match_score,
            'companyId', NEW.company_id
        ));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_attendance ON public.attendance;
CREATE TRIGGER trg_sync_attendance
    BEFORE INSERT OR UPDATE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION public.sync_attendance_columns();

-- Trigger Function: Leaves
CREATE OR REPLACE FUNCTION public.sync_leaves_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data IS NOT NULL AND NEW.data ? 'value' THEN
        NEW.employee_id := COALESCE(NEW.data->'value'->>'employeeId', NEW.data->'value'->>'employee_id', NEW.employee_id);
        NEW.employee_name := COALESCE(NEW.data->'value'->>'employeeName', NEW.data->'value'->>'employee_name', NEW.employee_name);
        NEW.leave_type := COALESCE(NEW.data->'value'->>'leaveType', NEW.data->'value'->>'leave_type', NEW.leave_type);
        NEW.start_date := COALESCE(NEW.data->'value'->>'startDate', NEW.data->'value'->>'start_date', NEW.start_date);
        NEW.end_date := COALESCE(NEW.data->'value'->>'endDate', NEW.data->'value'->>'end_date', NEW.end_date);
        NEW.days_count := COALESCE((NEW.data->'value'->>'daysCount')::integer, (NEW.data->'value'->>'days_count')::integer, NEW.days_count, 1);
        NEW.status := COALESCE(NEW.data->'value'->>'status', NEW.status, 'En attente');
        NEW.reason := COALESCE(NEW.data->'value'->>'reason', NEW.reason);
        NEW.company_id := COALESCE(NEW.data->'value'->>'companyId', NEW.data->'value'->>'company_id', NEW.company_id, 'TG');
    ELSIF NEW.data IS NULL OR jsonb_typeof(NEW.data) = 'null' OR NEW.data = '{}'::jsonb THEN
        NEW.data := jsonb_build_object('value', jsonb_build_object(
            'id', NEW.id,
            'employeeId', NEW.employee_id,
            'employeeName', NEW.employee_name,
            'leaveType', NEW.leave_type,
            'startDate', NEW.start_date,
            'endDate', NEW.end_date,
            'daysCount', NEW.days_count,
            'status', NEW.status,
            'reason', NEW.reason,
            'companyId', NEW.company_id
        ));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_leaves ON public.leaves;
CREATE TRIGGER trg_sync_leaves
    BEFORE INSERT OR UPDATE ON public.leaves
    FOR EACH ROW EXECUTE FUNCTION public.sync_leaves_columns();

-- Trigger Function: Adjustments
CREATE OR REPLACE FUNCTION public.sync_adjustments_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data IS NOT NULL AND NEW.data ? 'value' THEN
        NEW.employee_id := COALESCE(NEW.data->'value'->>'employeeId', NEW.data->'value'->>'employee_id', NEW.employee_id);
        NEW.employee_name := COALESCE(NEW.data->'value'->>'employeeName', NEW.data->'value'->>'employee_name', NEW.employee_name);
        NEW.type := COALESCE(NEW.data->'value'->>'type', NEW.type);
        NEW.amount := COALESCE((NEW.data->'value'->>'amount')::numeric, (NEW.data->'value'->>'amount_field')::numeric, NEW.amount, 0);
        NEW.date := COALESCE(NEW.data->'value'->>'date', NEW.date);
        NEW.description := COALESCE(NEW.data->'value'->>'description', NEW.description);
        NEW.status := COALESCE(NEW.data->'value'->>'status', NEW.status, 'En attente');
        NEW.company_id := COALESCE(NEW.data->'value'->>'companyId', NEW.data->'value'->>'company_id', NEW.company_id, 'TG');
    ELSIF NEW.data IS NULL OR jsonb_typeof(NEW.data) = 'null' OR NEW.data = '{}'::jsonb THEN
        NEW.data := jsonb_build_object('value', jsonb_build_object(
            'id', NEW.id,
            'employeeId', NEW.employee_id,
            'employeeName', NEW.employee_name,
            'type', NEW.type,
            'amount', NEW.amount,
            'date', NEW.date,
            'description', NEW.description,
            'status', NEW.status,
            'companyId', NEW.company_id
        ));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_adjustments ON public.adjustments;
CREATE TRIGGER trg_sync_adjustments
    BEFORE INSERT OR UPDATE ON public.adjustments
    FOR EACH ROW EXECUTE FUNCTION public.sync_adjustments_columns();

-- Trigger Function: Payslips
CREATE OR REPLACE FUNCTION public.sync_payslips_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data IS NOT NULL AND NEW.data ? 'value' THEN
        NEW.employee_id := COALESCE(NEW.data->'value'->>'employeeId', NEW.data->'value'->>'employee_id', NEW.employee_id);
        NEW.employee_name := COALESCE(NEW.data->'value'->>'employeeName', NEW.data->'value'->>'employee_name', NEW.employee_name);
        NEW.employee_position := COALESCE(NEW.data->'value'->>'employeePosition', NEW.data->'value'->>'employee_position', NEW.employee_position);
        NEW.period := COALESCE(NEW.data->'value'->>'period', NEW.period);
        NEW.basic_salary := COALESCE((NEW.data->'value'->>'basicSalary')::numeric, (NEW.data->'value'->>'basic_salary')::numeric, NEW.basic_salary, 0);
        NEW.total_primes := COALESCE((NEW.data->'value'->>'totalPrimes')::numeric, (NEW.data->'value'->>'total_primes')::numeric, NEW.total_primes, 0);
        NEW.total_avances := COALESCE((NEW.data->'value'->>'totalAvances')::numeric, (NEW.data->'value'->>'total_avances')::numeric, NEW.total_avances, 0);
        NEW.social_deductions := COALESCE((NEW.data->'value'->>'socialDeductions')::numeric, (NEW.data->'value'->>'social_deductions')::numeric, NEW.social_deductions, 0);
        NEW.tax_deductions := COALESCE((NEW.data->'value'->>'taxDeductions')::numeric, (NEW.data->'value'->>'tax_deductions')::numeric, NEW.tax_deductions, 0);
        NEW.net_salary := COALESCE((NEW.data->'value'->>'netSalary')::numeric, (NEW.data->'value'->>'net_salary')::numeric, NEW.net_salary, 0);
        NEW.payment_status := COALESCE(NEW.data->'value'->>'paymentStatus', NEW.data->'value'->>'payment_status', NEW.payment_status, 'Brouillon');
        NEW.payment_date := COALESCE(NEW.data->'value'->>'paymentDate', NEW.data->'value'->>'payment_date', NEW.payment_date);
        NEW.presences_count := COALESCE((NEW.data->'value'->>'presencesCount')::integer, (NEW.data->'value'->>'presences_count')::integer, NEW.presences_count, 0);
        NEW.absences_count := COALESCE((NEW.data->'value'->>'absencesCount')::integer, (NEW.data->'value'->>'absences_count')::integer, NEW.absences_count, 0);
        NEW.loans_deduction := COALESCE((NEW.data->'value'->>'loansDeduction')::numeric, (NEW.data->'value'->>'loans_deduction')::numeric, NEW.loans_deduction, 0);
        NEW.custom_primes := COALESCE((NEW.data->'value'->>'customPrimes')::numeric, (NEW.data->'value'->>'custom_primes')::numeric, NEW.custom_primes, 0);
        NEW.custom_withdrawals := COALESCE((NEW.data->'value'->>'customWithdrawals')::numeric, (NEW.data->'value'->>'custom_withdrawals')::numeric, NEW.custom_withdrawals, 0);
        NEW.company_id := COALESCE(NEW.data->'value'->>'companyId', NEW.data->'value'->>'company_id', NEW.company_id, 'TG');
    ELSIF NEW.data IS NULL OR jsonb_typeof(NEW.data) = 'null' OR NEW.data = '{}'::jsonb THEN
        NEW.data := jsonb_build_object('value', jsonb_build_object(
            'id', NEW.id,
            'employeeId', NEW.employee_id,
            'employeeName', NEW.employee_name,
            'employeePosition', NEW.employee_position,
            'period', NEW.period,
            'basicSalary', NEW.basic_salary,
            'totalPrimes', NEW.total_primes,
            'totalAvances', NEW.total_avances,
            'socialDeductions', NEW.social_deductions,
            'taxDeductions', NEW.tax_deductions,
            'netSalary', NEW.net_salary,
            'paymentStatus', NEW.payment_status,
            'paymentDate', NEW.payment_date,
            'presencesCount', NEW.presences_count,
            'absencesCount', NEW.absences_count,
            'loansDeduction', NEW.loans_deduction,
            'customPrimes', NEW.custom_primes,
            'customWithdrawals', NEW.custom_withdrawals,
            'companyId', NEW.company_id
        ));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_payslips ON public.payslips;
CREATE TRIGGER trg_sync_payslips
    BEFORE INSERT OR UPDATE ON public.payslips
    FOR EACH ROW EXECUTE FUNCTION public.sync_payslips_columns();


-- Trigger Function: On auth.users insert, auto-create a profile in public.users_profiles
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
        new.id::text,
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Note: Trigger bind is conditionally activated based on auth schema presence.

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_branch_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.my_clinic_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.my_clinic_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.my_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fused_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.my_commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_pending_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sav_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_mobile_money ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opticalize_sync ENABLE ROW LEVEL SECURITY;

-- Define global permissive policies for rapid operation, fully bypassable via admin token.
-- Standard public access rules for preview integration
CREATE POLICY "Allow public full access" ON public.users_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.hq_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.hq_branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.zones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.hq_branch_modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.leaves FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.adjustments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.payslips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.crm_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.my_clinic_appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.my_clinic_exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.my_prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.fused_catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.stock_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.stock_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.my_commandes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.hq_pending_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.saas_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.vouchers_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.sav_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.accounting_revenues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.accounting_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.accounting_mobile_money FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.push_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.backups_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access" ON public.opticalize_sync FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- REALTIME CONFIGURATION (SUPABASE PUBLIC BROADCAST)
-- ==========================================

-- Enable Replica Identity Full to receive entire row state on updates/deletes
ALTER TABLE public.users_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.roles REPLICA IDENTITY FULL;
ALTER TABLE public.permissions REPLICA IDENTITY FULL;
ALTER TABLE public.hq_companies REPLICA IDENTITY FULL;
ALTER TABLE public.hq_branches REPLICA IDENTITY FULL;
ALTER TABLE public.zones REPLICA IDENTITY FULL;
ALTER TABLE public.hq_branch_modules REPLICA IDENTITY FULL;
ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.attendance REPLICA IDENTITY FULL;
ALTER TABLE public.leaves REPLICA IDENTITY FULL;
ALTER TABLE public.adjustments REPLICA IDENTITY FULL;
ALTER TABLE public.payslips REPLICA IDENTITY FULL;
ALTER TABLE public.crm_customers REPLICA IDENTITY FULL;
ALTER TABLE public.customers REPLICA IDENTITY FULL;
ALTER TABLE public.my_clinic_appointments REPLICA IDENTITY FULL;
ALTER TABLE public.my_clinic_exams REPLICA IDENTITY FULL;
ALTER TABLE public.my_prescriptions REPLICA IDENTITY FULL;
ALTER TABLE public.fused_catalog REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.stock_items REPLICA IDENTITY FULL;
ALTER TABLE public.stock_history REPLICA IDENTITY FULL;
ALTER TABLE public.inventory REPLICA IDENTITY FULL;
ALTER TABLE public.suppliers REPLICA IDENTITY FULL;
ALTER TABLE public.my_commandes REPLICA IDENTITY FULL;
ALTER TABLE public.hq_pending_orders REPLICA IDENTITY FULL;
ALTER TABLE public.saas_orders REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.vouchers_list REPLICA IDENTITY FULL;
ALTER TABLE public.sav_claims REPLICA IDENTITY FULL;
ALTER TABLE public.accounting_revenues REPLICA IDENTITY FULL;
ALTER TABLE public.accounting_expenses REPLICA IDENTITY FULL;
ALTER TABLE public.accounting_mobile_money REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.push_logs REPLICA IDENTITY FULL;
ALTER TABLE public.backups_list REPLICA IDENTITY FULL;
ALTER TABLE public.opticalize_sync REPLICA IDENTITY FULL;

-- Add all tables to Supabase Realtime publication
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.users_profiles,
    public.roles,
    public.permissions,
    public.hq_companies,
    public.hq_branches,
    public.zones,
    public.hq_branch_modules,
    public.employees,
    public.attendance,
    public.leaves,
    public.adjustments,
    public.payslips,
    public.crm_customers,
    public.customers,
    public.my_clinic_appointments,
    public.my_clinic_exams,
    public.my_prescriptions,
    public.fused_catalog,
    public.products,
    public.stock_items,
    public.stock_history,
    public.inventory,
    public.suppliers,
    public.my_commandes,
    public.hq_pending_orders,
    public.saas_orders,
    public.invoices,
    public.vouchers_list,
    public.sav_claims,
    public.accounting_revenues,
    public.accounting_expenses,
    public.accounting_mobile_money,
    public.audit_logs,
    public.push_logs,
    public.backups_list,
    public.opticalize_sync;
COMMIT;
