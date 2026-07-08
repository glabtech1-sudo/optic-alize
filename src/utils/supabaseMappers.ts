/**
 * Supabase Schema Mapping Functions
 * Automatically maps application form fields and state objects to match PostgreSQL table columns.
 * Keeps business data fully typed and structured according to supabase_migration.sql schemas.
 */

// RH (HR) Module Mappers
export function mapEmployeeToSupabase(emp: any) {
  if (!emp) return null;
  return {
    id: String(emp.id),
    first_name: emp.firstName || emp.first_name || '',
    last_name: emp.lastName || emp.last_name || '',
    position: emp.position || '',
    department: emp.department || '',
    email: emp.email || '',
    phone: emp.phone || '',
    hire_date: emp.hireDate || emp.hire_date || '',
    basic_salary: Number(emp.basicSalary !== undefined ? emp.basicSalary : (emp.basic_salary !== undefined ? emp.basic_salary : 0)),
    status: emp.status || 'Actif',
    boutique: emp.boutique || '',
    photo: emp.photo || null,
    pin_code: emp.pinCode || emp.pin_code || null,
    birth_date: emp.birthDate || emp.birth_date || null,
    id_card_number: emp.idCardNumber || emp.id_card_number || null,
    contract_type: emp.contractType || emp.contract_type || null,
    face_id_registered: emp.faceIdRegistered !== undefined ? !!emp.faceIdRegistered : (emp.face_id_registered !== undefined ? !!emp.face_id_registered : false),
    liveness_proof: emp.livenessProof !== undefined ? !!emp.livenessProof : (emp.liveness_proof !== undefined ? !!emp.liveness_proof : false),
    company_id: emp.companyId || emp.company_id || 'TG'
  };
}

export function mapAttendanceToSupabase(entry: any) {
  if (!entry) return null;
  return {
    id: String(entry.id),
    employee_id: entry.employeeId || entry.employee_id || '',
    employee_name: entry.employeeName || entry.employee_name || '',
    date: entry.date || '',
    status: entry.status || '',
    check_in_time: entry.checkInTime || entry.check_in_time || null,
    pause_time: entry.pauseTime || entry.pause_time || null,
    reprise_time: entry.repriseTime || entry.reprise_time || null,
    check_out_time: entry.checkOutTime || entry.check_out_time || null,
    notes: entry.notes || null,
    photo: entry.photo || null,
    boutique: entry.boutique || '',
    gps_coords: entry.gpsCoords || entry.gps_coords || null,
    facial_match_score: entry.facialMatchScore !== undefined ? Number(entry.facialMatchScore) : (entry.facial_match_score !== undefined ? Number(entry.facial_match_score) : null),
    company_id: entry.companyId || entry.company_id || 'TG'
  };
}

export function mapLeaveToSupabase(req: any) {
  if (!req) return null;
  return {
    id: String(req.id),
    employee_id: req.employeeId || req.employee_id || '',
    employee_name: req.employeeName || req.employee_name || '',
    leave_type: req.leaveType || req.leave_type || '',
    start_date: req.startDate || req.start_date || '',
    end_date: req.endDate || req.end_date || '',
    days_count: Number(req.daysCount !== undefined ? req.daysCount : (req.days_count !== undefined ? req.days_count : 1)),
    status: req.status || 'En attente',
    reason: req.reason || null,
    company_id: req.companyId || req.company_id || 'TG'
  };
}

export function mapAdjustmentToSupabase(adj: any) {
  if (!adj) return null;
  return {
    id: String(adj.id),
    employee_id: adj.employeeId || adj.employee_id || '',
    employee_name: adj.employeeName || adj.employee_name || '',
    type: adj.type || '',
    amount: Number(adj.amount !== undefined ? adj.amount : (adj.amount_field !== undefined ? adj.amount_field : 0)),
    date: adj.date || '',
    description: adj.description || null,
    status: adj.status || 'En attente',
    company_id: adj.companyId || adj.company_id || 'TG'
  };
}

export function mapPayslipToSupabase(pay: any) {
  if (!pay) return null;
  return {
    id: String(pay.id),
    employee_id: pay.employeeId || pay.employee_id || '',
    employee_name: pay.employeeName || pay.employee_name || '',
    employee_position: pay.employeePosition || pay.employee_position || '',
    period: pay.period || '',
    basic_salary: Number(pay.basicSalary !== undefined ? pay.basicSalary : (pay.basic_salary !== undefined ? pay.basic_salary : 0)),
    total_primes: Number(pay.totalPrimes !== undefined ? pay.totalPrimes : (pay.total_primes !== undefined ? pay.total_primes : 0)),
    total_avances: Number(pay.totalAvances !== undefined ? pay.totalAvances : (pay.total_avances !== undefined ? pay.total_avances : 0)),
    social_deductions: Number(pay.socialDeductions !== undefined ? pay.socialDeductions : (pay.social_deductions !== undefined ? pay.social_deductions : 0)),
    tax_deductions: Number(pay.taxDeductions !== undefined ? pay.taxDeductions : (pay.tax_deductions !== undefined ? pay.tax_deductions : 0)),
    net_salary: Number(pay.netSalary !== undefined ? pay.netSalary : (pay.net_salary !== undefined ? pay.net_salary : 0)),
    payment_status: pay.paymentStatus || pay.payment_status || 'Brouillon',
    payment_date: pay.paymentDate || pay.payment_date || null,
    presences_count: Number(pay.presencesCount !== undefined ? pay.presencesCount : (pay.presences_count !== undefined ? pay.presences_count : 0)),
    absences_count: Number(pay.absencesCount !== undefined ? pay.absencesCount : (pay.absences_count !== undefined ? pay.absences_count : 0)),
    loans_deduction: Number(pay.loansDeduction !== undefined ? pay.loansDeduction : (pay.loans_deduction !== undefined ? pay.loans_deduction : 0)),
    custom_primes: Number(pay.customPrimes !== undefined ? pay.customPrimes : (pay.custom_primes !== undefined ? pay.custom_primes : 0)),
    custom_withdrawals: Number(pay.customWithdrawals !== undefined ? pay.customWithdrawals : (pay.custom_withdrawals !== undefined ? pay.custom_withdrawals : 0)),
    company_id: pay.companyId || pay.company_id || 'TG'
  };
}

// CRM, Stock, POS, Clinic, HQ, and Users Mappers
export function mapCustomerToSupabase(customer: any, boutiqueName?: string) {
  if (!customer) return null;
  const bName = boutiqueName || (typeof window !== 'undefined' ? (localStorage.getItem('optic_boutique_name') || 'Global') : 'Global');
  return {
    id: String(customer.id || customer.email || `cust-${Date.now()}`),
    boutique_name: bName,
    data: { value: customer },
    updated_at: new Date().toISOString()
  };
}

export function mapProductToSupabase(product: any, boutiqueName?: string) {
  if (!product) return null;
  const bName = boutiqueName || (typeof window !== 'undefined' ? (localStorage.getItem('optic_boutique_name') || 'Global') : 'Global');
  return {
    id: String(product.id || `prod-${Date.now()}`),
    boutique_name: bName,
    data: { value: product },
    updated_at: new Date().toISOString()
  };
}

export function mapOrderToSupabase(order: any, boutiqueName?: string) {
  if (!order) return null;
  const bName = boutiqueName || (typeof window !== 'undefined' ? (localStorage.getItem('optic_boutique_name') || 'Global') : 'Global');
  return {
    id: String(order.id || `ord-${Date.now()}`),
    boutique_name: bName,
    data: { value: order },
    updated_at: new Date().toISOString()
  };
}

export function mapAuditLogToSupabase(log: any, boutiqueName?: string) {
  if (!log) return null;
  const bName = boutiqueName || (typeof window !== 'undefined' ? (localStorage.getItem('optic_boutique_name') || 'Global') : 'Global');
  return {
    id: String(log.id || `log-${Date.now()}`),
    boutique_name: bName,
    data: { value: log },
    updated_at: new Date().toISOString()
  };
}

export function mapAppointmentToSupabase(appt: any, boutiqueName?: string) {
  if (!appt) return null;
  const bName = boutiqueName || (typeof window !== 'undefined' ? (localStorage.getItem('optic_boutique_name') || 'Global') : 'Global');
  return {
    id: String(appt.id || `appt-${Date.now()}`),
    boutique_name: bName,
    data: { value: appt },
    updated_at: new Date().toISOString()
  };
}

export function mapSightExamToSupabase(exam: any, boutiqueName?: string) {
  if (!exam) return null;
  const bName = boutiqueName || (typeof window !== 'undefined' ? (localStorage.getItem('optic_boutique_name') || 'Global') : 'Global');
  return {
    id: String(exam.id || `exam-${Date.now()}`),
    boutique_name: bName,
    data: { value: exam },
    updated_at: new Date().toISOString()
  };
}

export function mapPrescriptionToSupabase(pres: any, boutiqueName?: string) {
  if (!pres) return null;
  const bName = boutiqueName || (typeof window !== 'undefined' ? (localStorage.getItem('optic_boutique_name') || 'Global') : 'Global');
  return {
    id: String(pres.id || `pres-${Date.now()}`),
    boutique_name: bName,
    data: { value: pres },
    updated_at: new Date().toISOString()
  };
}

export function mapCompanyToSupabase(company: any, boutiqueName?: string) {
  if (!company) return null;
  const bName = boutiqueName || (typeof window !== 'undefined' ? (localStorage.getItem('optic_boutique_name') || 'Global') : 'Global');
  return {
    id: String(company.id || `comp-${Date.now()}`),
    boutique_name: bName,
    data: { value: company },
    updated_at: new Date().toISOString()
  };
}

export function mapBranchToSupabase(branch: any, boutiqueName?: string) {
  if (!branch) return null;
  const bName = boutiqueName || (typeof window !== 'undefined' ? (localStorage.getItem('optic_boutique_name') || 'Global') : 'Global');
  return {
    id: String(branch.id || `branch-${Date.now()}`),
    boutique_name: bName,
    data: { value: branch },
    updated_at: new Date().toISOString()
  };
}

export function mapUserToSupabase(user: any) {
  if (!user) return null;
  return {
    id: user.id || user.uid || `user-${Date.now()}`,
    name: user.name || user.displayName || 'Nouvel Utilisateur',
    email: user.email || '',
    role: user.role || 'Viewer',
    status: user.status || 'Active',
    phone: user.phone || null,
    location: user.location || 'Optic Alizé - DIRECTION',
    allowed_boutiques: user.allowedBoutiques || user.allowed_boutiques || [],
    allowed_modules: user.allowedModules || user.allowed_modules || [],
    company_id: user.companyId || user.company_id || 'TG'
  };
}
