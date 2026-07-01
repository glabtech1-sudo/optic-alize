import React, { useState, useEffect } from 'react';
import { 
  Building2, Globe, Users, ShoppingCart, BarChart3, Database, 
  Plus, Search, Sliders, Shield, BookOpen, Clock, Code, FileCode, CheckCircle, 
  MapPin, DollarSign, Wallet, TrendingUp, Briefcase, Eye, Trash2, Edit3, ArrowRight, Save,
  TrendingDown, Award, Activity, Package, Inbox, RefreshCw, Download, ShieldAlert, Clipboard
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { ArchFile } from '../types/architecture';
import SaaSUsers from './SaaSUsers';

// --- CLEAN ARCHITECTURE TYPE DEFINITIONS ---
export interface Zone {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'Actif' | 'Inactif';
  currency: string;
  tax_rate: number;
}

export interface Branch {
  id: string;
  zone_id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo: string;
  manager_id: string;
  currency: string;
  language: string;
  tax_rate: number;
  status: 'Actif' | 'Fermé' | 'Audit' | 'Inactif' | 'Archivé';
  created_at: string;
}

export interface HQEmployee {
  id: string;
  zone_id: string;
  branch_id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  email: string;
  status: string;
  salary: number;
}

export interface HQSale {
  id: string;
  zone_id: string;
  branch_id: string;
  customerName: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  itemCount: number;
  sellerName?: string;
}

export const ALL_AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard', description: 'Vue globale, KPIs et rapports d\'activité en temps réel.' },
  { id: 'fidelisation', label: 'Client & Registre', description: 'Gestion des dossiers clients, historique d\'achats et réfractions.' },
  { id: 'fidelisation_sav', label: 'Fidélisation & S.A.V', description: 'Programme de fidélisation et service après-vente.' },
  { id: 'clinique', label: 'Clinique & Prescription', description: 'Tests optométriques, fiches de réfraction et ordonnances.' },
  { id: 'products', label: 'Catalogue Optic', description: 'Stocks de verres, montures et accessoires.' },
  { id: 'commande', label: 'Commande Optic', description: 'Suivi et expéditions chez les fournisseurs et labos.' },
  { id: 'orders', label: 'Point de Vente', description: 'Facturation, encaissements multicartes et devis mutuelles.' },
  { id: 'journal', label: 'Journal de caisse', description: 'Suivi des écarts d\'espèces et archivage des pièces jointes.' },
  { id: 'websockets', label: 'Messagerie', description: 'Salons de chat et messagerie instantanée inter-succursales.' },
  { id: 'revenue', label: 'Comptabilité & Trésorerie', description: 'Suivi comptable, rapprochement bancaire et ventilation.' },
  { id: 'reports', label: 'Audits & reports', description: 'Rapports d\'activité consolidés pour le siège.' },
  { id: 'hr', label: 'Ressources Humaines', description: 'Gestion des fiches collaborateurs et contrats.' },
  { id: 'presence', label: 'Présence Employés', description: 'Heures d\'émargement et suivi de présence.' },
  { id: 'gestion_optic', label: 'Gestion Optic', description: 'Atelier de montage, flux d\'usinage et rhabillage.' },
  { id: 'super_admin_monitor', label: 'Supervision HQ (Super Admin)', description: 'Outils de contrôle global du réseau SaaS.' },
  { id: 'settings', label: 'Paramètres', description: 'Gestion des configurations succursales, TVA et langues.' }
];

interface SuperAdminHQModuleProps {
  onAddGeneratedFiles: (files: ArchFile[]) => void;
  currentLanguage?: 'FR' | 'EN';
  darkMode?: boolean;
  currentUserEmail?: string;
  orgName?: string;
  setOrgName?: (name: string) => void;
  orgDomain?: string;
  setOrgDomain?: (domain: string) => void;
  orgLicence?: string;
  companyEmail?: string;
  setCompanyEmail?: (email: string) => void;
  companyPhone?: string;
  setCompanyPhone?: (phone: string) => void;
  appLogo?: string;
  setAppLogo?: (logo: string) => void;
  users?: any[];
  setUsers?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function SuperAdminHQModule({ 
  onAddGeneratedFiles, 
  currentLanguage = 'FR',
  darkMode = false,
  currentUserEmail = 'glabtech1@opticalize.com',
  orgName: propOrgName,
  setOrgName: propSetOrgName,
  orgDomain: propOrgDomain,
  setOrgDomain: propSetOrgDomain,
  orgLicence: propOrgLicence,
  companyEmail: propCompanyEmail,
  setCompanyEmail: propSetCompanyEmail,
  companyPhone: propCompanyPhone,
  setCompanyPhone: propSetCompanyPhone,
  appLogo: propAppLogo,
  setAppLogo: propSetAppLogo,
  users,
  setUsers,
}: SuperAdminHQModuleProps) {
  const [activeTab, setActiveTab] = useState<'kpis' | 'boutiques' | 'sales' | 'employees' | 'users' | 'organization' | 'db_schema' | 'backups'>('kpis');
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'delete_branch' | 'archive_branch' | 'deactivate_branch' | 'activate_branch' | 'delete_zone' | 'reset_all' | 'alert_only';
    targetId?: string;
  }>({ isOpen: false, title: '', message: '', actionType: 'alert_only' });
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetProgress, setResetProgress] = useState<number | null>(null);
  const [resetProgressText, setResetProgressText] = useState<string>('');

  // Backup & Restore states
  const [backups, setBackups] = useState<any[]>(() => {
    const saved = localStorage.getItem('optic_backups_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });
  const [newBackupName, setNewBackupName] = useState('');
  const [backupFileError, setBackupFileError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('optic_backups_list', JSON.stringify(backups));
  }, [backups]);

  const triggerAlert = (title: string, message: string) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      actionType: 'alert_only'
    });
  };

  // --- MERGED LOCAL STATES / CONTROLLED WRAPPERS ---
  const [lclOrgName, setLclOrgName] = useState(propOrgName || 'Optic Alizé Main Head Office');
  const orgName = propOrgName !== undefined ? propOrgName : lclOrgName;
  const setOrgName = propSetOrgName || setLclOrgName;

  const [lclOrgDomain, setLclOrgDomain] = useState(propOrgDomain || 'opticalize.com');
  const orgDomain = propOrgDomain !== undefined ? propOrgDomain : lclOrgDomain;
  const setOrgDomain = propSetOrgDomain || setLclOrgDomain;

  const orgLicence = propOrgLicence || 'SaaS-Enterprise-2026-X812';

  const [lclCompanyEmail, setLclCompanyEmail] = useState(propCompanyEmail || 'contact@opticalize.com');
  const companyEmail = propCompanyEmail !== undefined ? propCompanyEmail : lclCompanyEmail;
  const setCompanyEmail = propSetCompanyEmail || setLclCompanyEmail;

  const [lclCompanyPhone, setLclCompanyPhone] = useState(propCompanyPhone || '+228 90 00 00 00');
  const companyPhone = propCompanyPhone !== undefined ? propCompanyPhone : lclCompanyPhone;
  const setCompanyPhone = propSetCompanyPhone || setLclCompanyPhone;

  const [lclAppLogo, setLclAppLogo] = useState(propAppLogo || '');
  const appLogo = propAppLogo !== undefined ? propAppLogo : lclAppLogo;
  const setAppLogo = propSetAppLogo || setLclAppLogo;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');

  // --- STATE WITH PRE-RESOLVED REPOSITORY MOCK DATA (PERSISTED IN LOCALSTORAGE) ---
  const [zones, setZones] = useState<Zone[]>(() => {
    const saved = localStorage.getItem('optic_hq_zones');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    const defaults: Zone[] = [];
    localStorage.setItem('optic_hq_zones', JSON.stringify(defaults));
    return defaults;
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('optic_hq_branches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    const defaults: Branch[] = [];
    localStorage.setItem('optic_hq_branches', JSON.stringify(defaults));
    return defaults;
  });

  const [sales, setSales] = useState<HQSale[]>(() => {
    const saved = localStorage.getItem('optic_hq_sales');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [employees, setEmployees] = useState<HQEmployee[]>(() => {
    const saved = localStorage.getItem('optic_hq_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [hqPendingOrders, setHqPendingOrders] = useState(() => {
    const saved = localStorage.getItem('optic_hq_pending_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('optic_hq_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('optic_hq_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('optic_hq_pending_orders', JSON.stringify(hqPendingOrders));
  }, [hqPendingOrders]);

  // --- CRUD AND ARCHITECTURE CODE EXPORTER ACTION ---
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [blueprintsExported, setBlueprintsExported] = useState(false);

  // New Zone State fields
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDesc, setNewZoneDesc] = useState('');
  const [newZoneCurrency, setNewZoneCurrency] = useState('FCFA');
  const [newZoneTax, setNewZoneTax] = useState(18);

  // New Branch State fields
  const [newBranchZone, setNewBranchZone] = useState('ZONE-UEMOA');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('Boutique');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchEmail, setNewBranchEmail] = useState('');
  const [newBranchManager, setNewBranchManager] = useState('');
  const [newBranchCurrency, setNewBranchCurrency] = useState('XOF');
  const [newBranchTax, setNewBranchTax] = useState(18);

  // --- Dynamic Branch Modules Selection ---
  const [branchModules, setBranchModules] = useState<{id: string; branch_id: string; module_name: string; is_enabled: boolean}[]>(() => {
    const saved = localStorage.getItem('optic_hq_branch_modules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    const defaults: {id: string; branch_id: string; module_name: string; is_enabled: boolean}[] = [];
    const defaultModules = ['dashboard', 'crm', 'clinique', 'products', 'commande', 'orders', 'journal', 'websockets', 'revenue', 'reports', 'hr', 'gestion_optic', 'settings'];
    const defaultBranches = [
      { id: 'BR-DAKAR' },
      { id: 'BR-ABIDJAN' },
      { id: 'BR-LOME' },
      { id: 'BR-PARIS' },
      { id: 'BR-DOUALA' }
    ];
    defaultBranches.forEach(b => {
      defaultModules.forEach(m => {
        defaults.push({
          id: `BM-${b.id}-${m}`,
          branch_id: b.id,
          module_name: m,
          is_enabled: b.id === 'BR-PARIS' ? ['dashboard', 'crm', 'products', 'orders', 'journal', 'settings'].includes(m) : true
        });
      });
    });
    localStorage.setItem('optic_hq_branch_modules', JSON.stringify(defaults));
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('optic_hq_branch_modules', JSON.stringify(branchModules));
  }, [branchModules]);

  const [newBranchModules, setNewBranchModules] = useState<{ [key: string]: boolean }>({
    dashboard: true,
    crm: true,
    clinique: true,
    products: true,
    commande: true,
    orders: true,
    journal: true,
    websockets: true,
    revenue: true,
    reports: true,
    hr: true,
    gestion_optic: true,
    settings: true
  });

  const [editBranchModules, setEditBranchModules] = useState<{ [key: string]: boolean }>({});

  // States for Editing and Managing life-cycle of a Boutique (Branch)
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editBranchZone, setEditBranchZone] = useState('');
  const [editBranchCode, setEditBranchCode] = useState('');
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchAddress, setEditBranchAddress] = useState('');
  const [editBranchCity, setEditBranchCity] = useState('Boutique');
  const [editBranchPhone, setEditBranchPhone] = useState('');
  const [editBranchEmail, setEditBranchEmail] = useState('');
  const [editBranchManager, setEditBranchManager] = useState('');
  const [editBranchCurrency, setEditBranchCurrency] = useState('');
  const [editBranchTax, setEditBranchTax] = useState(18);
  const [editBranchStatus, setEditBranchStatus] = useState<'Actif' | 'Fermé' | 'Audit' | 'Inactif' | 'Archivé'>('Actif');

  // Interactive filters
  const [branchFilterStatus, setBranchFilterStatus] = useState<string>('ALL');
  const [showArchivedBranches, setShowArchivedBranches] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneCode || !newZoneName) return triggerAlert('Formulaire Incomplet', 'Veuillez remplir le code et le nom de la zone géographique !');
    const zone: Zone = {
      id: `ZONE-${newZoneCode.toUpperCase().replace(/\s+/g, '-')}`,
      code: newZoneCode.toUpperCase(),
      name: newZoneName,
      description: newZoneDesc,
      status: 'Actif',
      currency: newZoneCurrency,
      tax_rate: Number(newZoneTax)
    };
    const updated = [...zones, zone];
    setZones(updated);
    localStorage.setItem('optic_hq_zones', JSON.stringify(updated));
    setShowAddZoneModal(false);
    // Reset fields
    setNewZoneCode('');
    setNewZoneName('');
    setNewZoneDesc('');
  };

  const validateBranchData = (data: {
    code: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    tax_rate: number;
  }) => {
    const errors: { [key: string]: string } = {};
    
    // Code validation
    if (!data.code.trim()) {
      errors.code = "Le code de la boutique est requis.";
    } else if (!/^OA-[A-Z0-9]+-\d+$/i.test(data.code.trim())) {
      errors.code = "Format requis : OA-XXX-YY (ex: OA-DKR-01).";
    }

    // Name validation
    if (!data.name.trim()) {
      errors.name = "La raison sociale est requise.";
    } else if (data.name.trim().length < 3) {
      errors.name = "La raison sociale doit contenir au moins 3 caractères.";
    }

    // Address validation
    if (!data.address.trim()) {
      errors.address = "L'adresse physique est requise.";
    } else if (data.address.trim().length < 5) {
      errors.address = "L'adresse doit contenir au moins 5 caractères.";
    }

    // City validation
    if (!data.city.trim()) {
      errors.city = "La ville locale est requise.";
    }

    // Phone validation
    if (!data.phone.trim()) {
      errors.phone = "Le numéro de téléphone est requis.";
    } else if (!/^\+?[0-9\s\-()]{5,20}$/.test(data.phone.trim())) {
      errors.phone = "Format de phone invalide (ex: +221 33 824 10 10).";
    }

    // Email validation
    if (!data.email.trim()) {
      errors.email = "L'adresse e-mail est requise.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.email = "Adresse email invalide (ex: dakar@opticalize.com).";
    }

    // Tax validation
    if (isNaN(data.tax_rate) || data.tax_rate < 0 || data.tax_rate > 100) {
      errors.tax_rate = "La taxe locale doit être un pourcentage entre 0 et 100.";
    }

    return errors;
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    const errors = validateBranchData({
      code: newBranchCode,
      name: newBranchName,
      address: newBranchAddress,
      city: newBranchCity,
      phone: newBranchPhone,
      email: newBranchEmail,
      tax_rate: Number(newBranchTax)
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Check duplicate code
    if (branches.some(b => b.code.toUpperCase() === newBranchCode.trim().toUpperCase())) {
      setValidationErrors({ code: "Ce code de boutique est déjà attribué." });
      return;
    }

    const branch: Branch = {
      id: `BR-${newBranchCode.toUpperCase().replace(/\s+/g, '-')}`,
      zone_id: newBranchZone,
      code: newBranchCode.toUpperCase().trim(),
      name: newBranchName.trim(),
      address: newBranchAddress.trim(),
      city: newBranchCity.trim(),
      phone: newBranchPhone.trim(),
      email: newBranchEmail.trim(),
      logo: '',
      manager_id: newBranchManager.trim() || 'EMP-01',
      currency: newBranchCurrency,
      language: 'FR',
      tax_rate: Number(newBranchTax),
      status: 'Actif',
      created_at: new Date().toISOString().split('T')[0]
    };

    const updated = [...branches, branch];
    setBranches(updated);
    localStorage.setItem('optic_hq_branches', JSON.stringify(updated));

    // Save dynamic modules selection for this newly created branch (branch_modules simulation)
    const newBmRecords = ALL_AVAILABLE_MODULES.map(m => ({
      id: `BM-${branch.id}-${m.id}`,
      branch_id: branch.id,
      module_name: m.id,
      is_enabled: !!newBranchModules[m.id]
    }));
    const updatedBmList = [...branchModules, ...newBmRecords];
    setBranchModules(updatedBmList);
    localStorage.setItem('optic_hq_branch_modules', JSON.stringify(updatedBmList));

    setShowAddBranchModal(false);
    alert(currentLanguage === 'FR' 
      ? `L'agence "${branch.name}" a été créée et configurée avec succès !` 
      : `The agency "${branch.name}" has been successfully created and configured!`
    );
    
    // Reset fields
    setNewBranchCode('');
    setNewBranchName('');
    setNewBranchAddress('');
    setNewBranchCity('');
    setNewBranchPhone('');
    setNewBranchEmail('');
    setNewBranchManager('');
    setNewBranchModules({
      dashboard: true,
      crm: true,
      clinique: true,
      products: true,
      commande: true,
      orders: true,
      journal: true,
      websockets: true,
      revenue: true,
      reports: true,
      hr: true,
      gestion_optic: true,
      settings: true
    });
  };

  const handleOpenEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setEditBranchZone(branch.zone_id);
    setEditBranchCode(branch.code);
    setEditBranchName(branch.name);
    setEditBranchAddress(branch.address);
    setEditBranchCity(branch.city);
    setEditBranchPhone(branch.phone);
    setEditBranchEmail(branch.email);
    setEditBranchManager(branch.manager_id);
    setEditBranchCurrency(branch.currency);
    setEditBranchTax(branch.tax_rate);
    setEditBranchStatus(branch.status);
    setValidationErrors({});

    // Load branch_modules settings for this branch (with safe default true if missing)
    const currentBm = branchModules.filter(bm => bm.branch_id === branch.id);
    const mObj: { [key: string]: boolean } = {};
    ALL_AVAILABLE_MODULES.forEach(m => {
      const found = currentBm.find(bm => bm.module_name === m.id);
      mObj[m.id] = found ? found.is_enabled : true;
    });
    setEditBranchModules(mObj);

    setShowEditBranchModal(true);
  };

  const handleUpdateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    setValidationErrors({});

    const errors = validateBranchData({
      code: editBranchCode,
      name: editBranchName,
      address: editBranchAddress,
      city: editBranchCity,
      phone: editBranchPhone,
      email: editBranchEmail,
      tax_rate: Number(editBranchTax)
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Check duplicate code (excluding self)
    if (branches.some(b => b.id !== editingBranch.id && b.code.toUpperCase() === editBranchCode.trim().toUpperCase())) {
      setValidationErrors({ code: "Ce code de boutique est déjà attribué." });
      return;
    }

    const updatedBranches = branches.map(b => {
      if (b.id === editingBranch.id) {
        return {
          ...b,
          zone_id: editBranchZone,
          code: editBranchCode.toUpperCase().trim(),
          name: editBranchName.trim(),
          address: editBranchAddress.trim(),
          city: editBranchCity.trim(),
          phone: editBranchPhone.trim(),
          email: editBranchEmail.trim(),
          manager_id: editBranchManager.trim(),
          currency: editBranchCurrency,
          tax_rate: Number(editBranchTax),
          status: editBranchStatus
        };
      }
      return b;
    });

    setBranches(updatedBranches);
    localStorage.setItem('optic_hq_branches', JSON.stringify(updatedBranches));

    // Save updated modules selection for this branch (branch_modules table simulation)
    const otherBm = branchModules.filter(bm => bm.branch_id !== editingBranch.id);
    const updatedBm = ALL_AVAILABLE_MODULES.map(m => ({
      id: `BM-${editingBranch.id}-${m.id}`,
      branch_id: editingBranch.id,
      module_name: m.id,
      is_enabled: !!editBranchModules[m.id]
    }));
    const updatedBmList = [...otherBm, ...updatedBm];
    setBranchModules(updatedBmList);
    localStorage.setItem('optic_hq_branch_modules', JSON.stringify(updatedBmList));

    setShowEditBranchModal(false);
    setEditingBranch(null);
    alert(currentLanguage === 'FR' 
      ? `Les modifications et modules de l'agence ont été enregistrés avec succès !` 
      : `The agency modifications and modules have been successfully saved!`
    );
  };

  const handleDeactivateBranch = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Désactiver la Boutique",
      message: "Êtes-vous sûr de vouloir désactiver cette boutique ? Elle sera isolée du flux de transactions actif.",
      actionType: 'deactivate_branch',
      targetId: id
    });
  };

  const handleActivateBranch = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Activer la Boutique",
      message: "Voulez-vous réactiver cette boutique dans le réseau actif d'enseignes ?",
      actionType: 'activate_branch',
      targetId: id
    });
  };

  const handleArchiveBranch = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Archiver la Boutique",
      message: "Êtes-vous sûr de vouloir archiver cette boutique d'enseigne ? Ses données resteront archivées.",
      actionType: 'archive_branch',
      targetId: id
    });
  };

  const handleRealDeleteBranch = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer définitivement la Boutique",
      message: "Êtes-vous ABSOLUMENT SÛR de vouloir SUPPRIMER définitivement cette boutique de l'architecture ? Cette action est irréversible et détruira ses accès.",
      actionType: 'delete_branch',
      targetId: id
    });
  };

  const handleDeleteZone = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Archiver la Zone Géographique",
      message: "Êtes-vous sûr de vouloir délier et archiver cette zone ? Toutes ses succursales d'enseignes seront isolées.",
      actionType: 'delete_zone',
      targetId: id
    });
  };

  const executeConfirmedAction = () => {
    const { actionType, targetId } = confirmDialog;
    
    if (actionType === 'delete_branch' && targetId) {
      const updated = branches.filter(b => b.id !== targetId);
      setBranches(updated);
      localStorage.setItem('optic_hq_branches', JSON.stringify(updated));
      triggerAlert("Succès", "La boutique a été supprimée définitivement avec succès de l'architecture.");
    }
    
    if (actionType === 'archive_branch' && targetId) {
      const updated = branches.map(b => b.id === targetId ? { ...b, status: 'Archivé' as const } : b);
      setBranches(updated);
      localStorage.setItem('optic_hq_branches', JSON.stringify(updated));
      triggerAlert("Archivé", "La boutique a été archivée avec succès.");
    }

    if (actionType === 'deactivate_branch' && targetId) {
      const updated = branches.map(b => b.id === targetId ? { ...b, status: 'Inactif' as const } : b);
      setBranches(updated);
      localStorage.setItem('optic_hq_branches', JSON.stringify(updated));
      triggerAlert("Désactivé", "La boutique a été désactivée avec succès.");
    }

    if (actionType === 'activate_branch' && targetId) {
      const updated = branches.map(b => b.id === targetId ? { ...b, status: 'Actif' as const } : b);
      setBranches(updated);
      localStorage.setItem('optic_hq_branches', JSON.stringify(updated));
      triggerAlert("Activé", "La boutique a été activée avec succès.");
    }

    if (actionType === 'delete_zone' && targetId) {
      const updated = zones.map(z => z.id === targetId ? { ...z, status: 'Inactif' as const } : z);
      setZones(updated);
      localStorage.setItem('optic_hq_zones', JSON.stringify(updated));
      triggerAlert("Désactivé", "La zone géographique a été marquée comme incursive/inactive.");
    }

    if (actionType === 'reset_all') {
      let isPasswordValid = false;
      const savedUsersStr = localStorage.getItem('optic_users');
      if (savedUsersStr) {
        try {
          const savedUsers = JSON.parse(savedUsersStr);
          if (Array.isArray(savedUsers)) {
            // Find any user with Admin role or special superadmin emails whose password matches the entered password
            const matchedAdmin = savedUsers.find(u => {
              const emailLower = (u.email || '').toLowerCase().trim();
              const isSuperAdminEmail = 
                emailLower === 'glabtech1@gmail.com' || 
                emailLower === 'glabtech1@opticalize.com' || 
                emailLower === 'anges.gildas@gmail.com' ||
                emailLower === 'anges.gildas@opticalize.com' || 
                emailLower === 'anges.gildas@opticalizé.com' ||
                emailLower === (currentUserEmail || '').toLowerCase().trim();
              
              return (u.role === 'Admin' || isSuperAdminEmail) && u.password === resetPassword;
            });
            if (matchedAdmin) {
              isPasswordValid = true;
            }
          }
        } catch (e) {
          console.error("Error reading saved users", e);
        }
      }
      
      // Check fallback hardcoded master creator/admin passwords
      const fallbackPasswords = ['Gildas@00741', '0074741', '0074', 'Gildas', 'G0074', 'glabtech1', 'password'];
      if (fallbackPasswords.includes(resetPassword)) {
        isPasswordValid = true;
      }

      if (!isPasswordValid) {
        setResetError("Mot de passe incorrect. Réinitialisation refusée.");
        return;
      }

      // Close current confirm dialog
      setConfirmDialog({ isOpen: false, title: '', message: '', actionType: 'alert_only' });
      
      // Start progress simulation
      setResetProgress(0);
      setResetProgressText("Initialisation du processus de purge globale du réseau...");

      let currentPct = 0;
      const interval = setInterval(() => {
        currentPct += 5;
        if (currentPct > 100) {
          currentPct = 100;
        }
        
        setResetProgress(currentPct);

        if (currentPct === 15) {
          setResetProgressText("Déconnexion des sessions actives et fermeture forcée des caisses...");
        } else if (currentPct === 35) {
          setResetProgressText("Purge complète de l'historique des ventes, rapports comptables et grands livres...");
        } else if (currentPct === 55) {
          setResetProgressText("Suppression sécurisée des dossiers patients, examens cliniques et ordonnances...");
        } else if (currentPct === 75) {
          setResetProgressText("Effacement des plannings RH, pointages présences biométriques et fiches de paie...");
        } else if (currentPct === 90) {
          setResetProgressText("Nettoyage global des inventaires de stock, historiques de mouvements et dossiers SAV...");
        } else if (currentPct === 100) {
          clearInterval(interval);
          setResetProgressText("Restauration des réglages d'usine réseau multi-succursales...");
          
          setTimeout(() => {
            setResetProgress(null);
            performActualSystemReset();
          }, 800);
        }
      }, 100);
      return;
    }

    // Close
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleSystemReset = () => {
    setResetPassword('');
    setResetError(null);
    setConfirmDialog({
      isOpen: true,
      title: "Confirmer la Réinitialisation Complète",
      message: "Cette opération va purger définitivement l'ensemble de votre réseau (Zones, Boutiques, Fiches métiers) ainsi que les 13 modules intégrés de SaaS Alizé (Tableau de bord, Client & Registre, Fidélisation & SAV, Catalogue, Ressource Humaine, Gestion Optic, Atelier, Caisse, Comptabilité, etc.) pour repartir d'un système vierge sans aucune donnée d'origine ou jeu d'essai. Cette action est irréversible.",
      actionType: 'reset_all'
    });
  };

  const performActualSystemReset = () => {
    // Completely sterile/virgin system with absolutely NO data as requested
    setZones([]);
    localStorage.setItem('optic_hq_zones', JSON.stringify([]));

    setBranches([]);
    localStorage.setItem('optic_hq_branches', JSON.stringify([]));

    setSales([]);
    localStorage.setItem('optic_hq_sales', JSON.stringify([]));

    setEmployees([]);
    localStorage.setItem('optic_hq_employees', JSON.stringify([]));

    setHqPendingOrders([]);
    localStorage.setItem('optic_hq_pending_orders', JSON.stringify([]));

    setBranchModules([]);
    localStorage.setItem('optic_hq_branch_modules', JSON.stringify([]));

    // Clear child branch modules data to empty the entire sandbox database
    localStorage.setItem('optic_crm_customers', JSON.stringify([]));
    localStorage.setItem('optic_my_prescriptions', JSON.stringify([]));
    localStorage.setItem('optic_my_clinic_appointments', JSON.stringify([]));
    localStorage.setItem('optic_my_clinic_exams', JSON.stringify([]));
    localStorage.setItem('optic_my_commandes', JSON.stringify([]));
    localStorage.setItem('optic_journal_data', JSON.stringify({}));
    localStorage.setItem('optic_vouchers_list', JSON.stringify([]));
    localStorage.setItem('optic_components_list', JSON.stringify([]));
    localStorage.setItem('optic_attendance_ledger', JSON.stringify([]));
    localStorage.setItem('optic_hr_employees', JSON.stringify([]));
    localStorage.setItem('optic_accounting_revenues', JSON.stringify([]));
    localStorage.setItem('optic_accounting_expenses', JSON.stringify([]));
    localStorage.setItem('optic_accounting_sessions', JSON.stringify([]));
    localStorage.setItem('optic_accounting_momo', JSON.stringify([]));
    localStorage.setItem('optic_stock_items', JSON.stringify([]));
    localStorage.setItem('optic_stock_history', JSON.stringify([]));
    localStorage.setItem('optic_sav_claims', JSON.stringify([]));
    localStorage.setItem('optic_push_logs', JSON.stringify([]));
    localStorage.setItem('optic_leaves', JSON.stringify([]));
    localStorage.setItem('optic_adjustments', JSON.stringify([]));
    localStorage.setItem('optic_payslips', JSON.stringify([]));
    localStorage.setItem('optic_saas_orders', JSON.stringify([]));
    localStorage.setItem('optic_accounting_boutique_balances', JSON.stringify([]));
    localStorage.setItem('optic_pos_products', JSON.stringify([]));
    localStorage.setItem('optic_system_factory_reset', 'true');

    // Remove authentication session details to take them back to login page on click
    localStorage.setItem('optic_is_authenticated', 'false');
    localStorage.removeItem('optic_remember_me');
    localStorage.removeItem('optic_remembered_email');
    localStorage.removeItem('optic_remembered_password');
    localStorage.removeItem('optic_user_email');
    localStorage.removeItem('optic_active_presence_boutique');

    setResetConfirmed(false);
    triggerAlert("Système Réinitialisé", "La réinitialisation globale du réseau a été effectuée avec succès ! Le système est désormais entièrement vierge, libre de toute donnée et prêt pour une nouvelle configuration d'usine.");
  };

  const handleCreateBackup = (customName?: string) => {
    const nameToUse = customName || newBackupName.trim() || `Sauvegarde du ${new Date().toLocaleString('fr-FR')}`;
    const keysToBackup = [
      'optic_hq_zones',
      'optic_hq_branches',
      'optic_hq_sales',
      'optic_hq_employees',
      'optic_hq_pending_orders',
      'optic_hq_branch_modules',
      'optic_crm_customers',
      'optic_my_prescriptions',
      'optic_my_clinic_appointments',
      'optic_my_clinic_exams',
      'optic_my_commandes',
      'optic_journal_data',
      'optic_vouchers_list',
      'optic_components_list',
      'optic_attendance_ledger',
      'optic_hr_employees',
      'optic_accounting_revenues',
      'optic_accounting_expenses',
      'optic_accounting_sessions',
      'optic_accounting_momo',
      'optic_stock_items',
      'optic_stock_history',
      'optic_sav_claims',
      'optic_push_logs',
      'optic_leaves',
      'optic_adjustments',
      'optic_payslips',
      'optic_saas_orders',
      'optic_accounting_boutique_balances',
      'optic_pos_products',
      'optic_system_factory_reset'
    ];

    const payload: Record<string, string | null> = {};
    keysToBackup.forEach(key => {
      payload[key] = localStorage.getItem(key);
    });

    const newBackupItem = {
      id: `backup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: nameToUse,
      createdAt: new Date().toLocaleString('fr-FR'),
      payload
    };

    setBackups(prev => [newBackupItem, ...prev]);
    setNewBackupName('');
    triggerAlert("Sauvegarde Créée", `La sauvegarde "${nameToUse}" a été créée avec succès localement !`);
  };

  const handleRestoreBackup = (backupItem: any) => {
    if (!backupItem || !backupItem.payload) return;
    
    // Clear factory reset flag so the restored data becomes active immediately!
    localStorage.removeItem('optic_system_factory_reset');

    Object.keys(backupItem.payload).forEach(key => {
      const val = backupItem.payload[key];
      if (val !== null) {
        localStorage.setItem(key, val);
      } else {
        localStorage.removeItem(key);
      }
    });

    triggerAlert("Restauration Réussie", `La sauvegarde "${backupItem.name}" a été restaurée avec succès ! L'application va se recharger pour appliquer toutes les données.`);
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleDownloadBackup = (backupItem: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupItem, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `alize_backup_${backupItem.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBackupFileError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && parsed.name && parsed.payload) {
          const importedBackup = {
            ...parsed,
            id: `backup-imported-${Date.now()}`,
            name: `[Importé] ${parsed.name}`
          };
          setBackups(prev => [importedBackup, ...prev]);
          triggerAlert("Importation Réussie", `La sauvegarde "${parsed.name}" a été importée avec succès dans votre liste !`);
        } else {
          setBackupFileError("Format de fichier de sauvegarde Alizé invalide.");
        }
      } catch (err) {
        setBackupFileError("Erreur lors de la lecture du fichier JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDeleteBackup = (id: string) => {
    setBackups(prev => prev.filter(b => b.id !== id));
  };

  // --- STATS CONSOLIDATOR ENGINE ---
  // We consolidate everything in FCFA for statistics. 1 EUR = 655.957 FCFA (CFA Franc standard peg)
  const eurToFcfa = (val: number, currency: string) => {
    if (currency === 'EUR' || currency === 'EUR') return val * 655.957;
    return val;
  };

  // 1. Chiffre d'affaires global (sales list consolidated in FCFA)
  const totalConsolidatedTurnoverFCFA = sales.reduce((acc, sale) => {
    return acc + eurToFcfa(sale.amount, sale.currency);
  }, 0);

  // 2. Dépenses globales (COGS + Rents + Staff Salaries + Lab external services)
  const totalCOGSFCFA = totalConsolidatedTurnoverFCFA * 0.38; // 38% for lenses and frames cost of goods
  const totalSalariesFCFA = employees.reduce((acc, emp) => {
    const isEur = emp.salary < 10000; // Sophie Kowalski's salary is 2800 EUR
    const salaryInFcfa = isEur ? emp.salary * 655.957 : emp.salary;
    return acc + salaryInFcfa;
  }, 0);
  const totalRentAndUtilitiesFCFA = branches.length * 150000; // 150,000 FCFA Rent/Utilities per store branch
  const totalLabFeesFCFA = totalConsolidatedTurnoverFCFA * 0.08; // 8% for laboratory framing/assembling fees
  
  const totalExpensesFCFA = totalCOGSFCFA + totalSalariesFCFA + totalRentAndUtilitiesFCFA + totalLabFeesFCFA;

  // 3. Bénéfice global (margin difference)
  const totalProfitFCFA = totalConsolidatedTurnoverFCFA - totalExpensesFCFA;

  // 4. Nombre total de boutiques et d'employés
  const totalBoutiquesCount = branches.length;
  const activeBranchCount = branches.filter(b => b.status === 'Actif').length;
  const workforceCount = employees.length;

  // 5. Nombre total de clients uniques
  const totalClientCount = new Set(sales.map(s => s.customerName)).size + 142; // Unique customers in sales + base database catalog

  // 6. Ventes du jour (Today's date is 2026-06-13 based on local clock)
  const todayDateString = '2026-06-13';
  const salesTodayList = sales.filter(s => s.date === todayDateString);
  const salesTodayCount = salesTodayList.length;
  const salesTodayVolumeFCFA = salesTodayList.reduce((sum, s) => sum + eurToFcfa(s.amount, s.currency), 0);

  // 7. Commandes en attente (at the central hub)
  const pendingOrdersCount = hqPendingOrders.length;
  const pendingOrdersVolumeFCFA = hqPendingOrders.reduce((sum, ord) => sum + eurToFcfa(ord.amount, ord.currency), 0);

  // 8. Classement des boutiques par chiffre d'affaires consolidé
  const topBranchesRanking = branches.map(b => {
    const totalBranchRevenueFCFA = sales
      .filter(s => s.branch_id === b.id)
      .reduce((sum, s) => sum + eurToFcfa(s.amount, s.currency), 0);
    const count = sales.filter(s => s.branch_id === b.id).length;
    return {
      ...b,
      revenueFCFA: totalBranchRevenueFCFA,
      transactionCount: count
    };
  }).sort((a, b) => b.revenueFCFA - a.revenueFCFA);

  // 9. Classement des meilleurs vendeurs (employees who generated sales)
  const topSellersRanking = employees.map(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`;
    const sellerSales = sales.filter(s => s.sellerName === fullName);
    const totalSalesVolumeFCFA = sellerSales.reduce((sum, s) => sum + eurToFcfa(s.amount, s.currency), 0);
    const count = sellerSales.length;
    return {
      name: fullName,
      position: emp.position,
      branchName: branches.find(b => b.id === emp.branch_id)?.city || 'Réseau',
      revenueFCFA: totalSalesVolumeFCFA,
      salesCount: count
    };
  }).filter(v => v.revenueFCFA > 0 || v.salesCount > 0)
    .sort((a, b) => b.revenueFCFA - a.revenueFCFA);

  // --- CHART FORMATTERS & HISTORICAL DATASETS ---

  // Chart 1: Évolution mensuelle des Ventes (Chiffre d'Affaires) & Dépenses & Bénéfices
  const monthlyPerformanceChartData = [
    { month: 'Janvier', CA: 11200000, Depenses: 8400000, Benefice: 2800000 },
    { month: 'Février', CA: 13500000, Depenses: 9800000, Benefice: 3700000 },
    { month: 'Mars', CA: 15100000, Depenses: 11200000, Benefice: 3900000 },
    { month: 'Avril', CA: 12900000, Depenses: 9900000, Benefice: 3000000 },
    { month: 'Mai', CA: 16800000, Depenses: 12300000, Benefice: 4500000 },
    { month: 'Juin (Réel)', CA: Math.round(totalConsolidatedTurnoverFCFA), Depenses: Math.round(totalExpensesFCFA), Benefice: Math.round(totalProfitFCFA) },
  ];

  // Chart 2: Comparaison Relative des Boutiques en FCFA unifiée
  const branchComparisonChartData = topBranchesRanking.map(b => ({
    name: b.city,
    CA: Math.round(b.revenueFCFA),
    Transactions: b.transactionCount,
    DeviseDorigine: b.currency
  }));

  // Chart 3: Évolution Annuelle consolidée du réseau (2024 - 2026)
  const annualEvolutionChartData = [
    { annee: '2024 (Historique)', CA: 125000000, Depenses: 92000000, Benefice: 33000000 },
    { annee: '2025 (Historique)', CA: 154000000, Depenses: 114000000, Benefice: 40000000 },
    { annee: '2026 (En cours + Proj.)', CA: Math.round(79500000 + totalConsolidatedTurnoverFCFA * 6), Depenses: Math.round(61600000 + totalExpensesFCFA * 6), Benefice: Math.round(17900000 + totalProfitFCFA * 6) }
  ];

  const COLORS_PALETTE = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const revenueByBranchData = branches.map(b => {
    const totalBranchSale = sales
      .filter(s => s.branch_id === b.id)
      .reduce((sum, s) => sum + s.amount, 0);
    return {
      name: b.city,
      revenue: totalBranchSale,
      currency: b.currency,
      fullName: b.name
    };
  });

  const revenueByZoneData = zones.map(z => {
    const totalZoneSale = sales
      .filter(s => s.zone_id === z.id)
      .reduce((sum, s) => sum + eurToFcfa(s.amount, s.currency), 0);
    return {
      name: z.name.split('(')[0].trim(),
      revenue: totalZoneSale
    };
  });

  // --- RECONCILIATION OF FILTERS ---
  const filteredSales = sales.filter(s => {
    const zoneMatch = selectedZoneFilter === 'ALL' || s.zone_id === selectedZoneFilter;
    const branchMatch = selectedBranchFilter === 'ALL' || s.branch_id === selectedBranchFilter;
    const searchMatch = searchQuery === '' || 
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    return zoneMatch && branchMatch && searchMatch;
  });

  const filteredEmployees = employees.filter(emp => {
    const zoneMatch = selectedZoneFilter === 'ALL' || emp.zone_id === selectedZoneFilter;
    const branchMatch = selectedBranchFilter === 'ALL' || emp.branch_id === selectedBranchFilter;
    const searchMatch = searchQuery === '' || 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    return zoneMatch && branchMatch && searchMatch;
  });

  // --- DEVELOPER HUD SPECIFICATION & BLUEPRINTS GENERATOR ---
  const handleTriggerExportCode = () => {
    const generatedBlueprints: ArchFile[] = [
      {
        name: 'super_admin_models.ts',
        path: 'backend/src/models/super_admin_models.ts',
        language: 'typescript',
        module: 'Super Admin HQ',
        layer: 'backend',
        type: 'model',
        description: 'Définitions d\'interfaces typées TypeScript pour les Zones et les Branches d\'une architecture centralisée.',
        content: `export interface Zone {
  id: string;      // UUID / String Code
  code: string;    // ex: ZM-WEST
  name: string;    // ex: Zone Afrique de l'Ouest
  description: string;
  status: 'Actif' | 'Inactif';
  currency: string;
  tax_rate: number;
}

export interface Branch {
  id: string;
  zone_id: string; // Foreign Key vers Zone
  code: string;    // ex: OA-DKR-01
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo?: string;
  manager_id: string;
  currency: string;
  language: string;
  tax_rate: number;
  status: 'Actif' | 'Fermé' | 'Audit' | 'Inactif' | 'Archivé';
  created_at: string;
}`
      },
      {
        name: 'boutique_controller.ts',
        path: 'backend/src/controllers/boutique_controller.ts',
        language: 'typescript',
        module: 'Super Admin HQ',
        layer: 'backend',
        type: 'controller',
        description: 'Vérifications, validations d\'intégrité et contrôleur API de service pour les boutiques du réseau.',
        content: `import { Request, Response } from 'express';
import { PostgresBranchRepository } from '../repositories/super_admin_repositories';

const branchRepo = new PostgresBranchRepository();

export const getBranches = async (req: Request, res: Response) => {
  try {
    const branches = await branchRepo.findAll();
    res.json({ success: true, count: branches.length, data: branches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { code, name, zone_id, address, city, phone, email, tax_rate, currency } = req.body;
    
    // Validations d'API strictes au niveau du Siege central
    if (!code || !name || !zone_id || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Champs obligatoires manquants.' });
    }
    
    if (!/^OA-[A-Z0-9]+-\\d+$/i.test(code)) {
      return res.status(400).json({ success: false, error: 'Format du code boutique invalide.' });
    }

    const newBranch = await branchRepo.create(req.body);
    res.status(201).json({ success: true, data: newBranch });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await branchRepo.update(id, req.body);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await branchRepo.delete(id);
    res.json({ success: true, message: 'Boutique supprimée avec succès.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};`
      },
      {
        name: 'super_admin_repositories.ts',
        path: 'backend/src/repositories/super_admin_repositories.ts',
        language: 'typescript',
        module: 'Super Admin HQ',
        layer: 'backend',
        type: 'repository',
        description: 'Implémentation du Repository Pattern pour centraliser les requêtes d\'accès aux données multi-zones et multi-branches.',
        content: `import { pool } from '../database/pg_pool';
import { Zone, Branch } from '../models/super_admin_models';

export interface IZoneRepository {
  findById(id: string): Promise<Zone | null>;
  findAll(): Promise<Zone[]>;
  create(zone: Omit<Zone, 'id'>): Promise<Zone>;
  update(id: string, zone: Partial<Zone>): Promise<Zone>;
}

export interface IBranchRepository {
  findById(id: string): Promise<Branch | null>;
  findAllByZone(zoneId: string): Promise<Branch[]>;
  findAll(): Promise<Branch[]>;
  create(branch: Branch): Promise<Branch>;
  update(id: string, branch: Partial<Branch>): Promise<Branch>;
  delete(id: string): Promise<void>;
}

export class PostgresZoneRepository implements IZoneRepository {
  async findById(id: string): Promise<Zone | null> {
    const { rows } = await pool.query('SELECT * FROM zones WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findAll(): Promise<Zone[]> {
    const { rows } = await pool.query('SELECT * FROM zones WHERE status = \\'Actif\\' ORDER BY name ASC');
    return rows;
  }

  async create(zone: Omit<Zone, 'id'>): Promise<Zone> {
    const { rows } = await pool.query(
      \`INSERT INTO zones (code, name, description, currency, tax_rate, status)
       VALUES ($1, $2, $3, $4, $5, \\'Actif\\') RETURNING *\`,
      [zone.code, zone.name, zone.description, zone.currency, zone.tax_rate]
    );
    return rows[0];
  }

  async update(id: string, zone: Partial<Zone>): Promise<Zone> {
    const fields = Object.keys(zone).map((key, i) => \`\${key} = \$\${i + 2}\`).join(', ');
    const values = Object.values(zone);
    const { rows } = await pool.query(
      \`UPDATE zones SET \${fields} WHERE id = $1 RETURNING *\`,
      [id, ...values]
    );
    return rows[0];
  }
}

export class PostgresBranchRepository implements IBranchRepository {
  async findById(id: string): Promise<Branch | null> {
    const { rows } = await pool.query('SELECT * FROM branches WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findAllByZone(zoneId: string): Promise<Branch[]> {
    const { rows } = await pool.query('SELECT * FROM branches WHERE zone_id = $1 ORDER BY name ASC', [zoneId]);
    return rows;
  }

  async findAll(): Promise<Branch[]> {
    const { rows } = await pool.query('SELECT * FROM branches ORDER BY created_at DESC');
    return rows;
  }

  async create(b: Branch): Promise<Branch> {
    const { rows } = await pool.query(
      \`INSERT INTO branches (zone_id, code, name, address, city, phone, email, logo, manager_id, currency, language, tax_rate, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *\`,
      [b.zone_id, b.code, b.name, b.address, b.city, b.phone, b.email, b.logo, b.manager_id, b.currency, b.language, b.tax_rate, b.status]
    );
    return rows[0];
  }

  async update(id: string, branch: Partial<Branch>): Promise<Branch> {
    const fields = Object.keys(branch).map((key, i) => \`\${key} = \$\${i + 2}\`).join(', ');
    const values = Object.values(branch);
    const { rows } = await pool.query(
      \`UPDATE branches SET \${fields} WHERE id = $1 RETURNING *\`,
      [id, ...values]
    );
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM branches WHERE id = $1', [id]);
  }
}`
      },
      {
        name: 'boutique_api_client.dart',
        path: 'flutter/lib/services/boutique_api_client.dart',
        language: 'dart',
        module: 'Super Admin HQ',
        layer: 'data',
        type: 'repository',
        description: 'Client d\'API Dart pour communiquer avec le serveur centralisé d\'Optic Alizé via Dio.',
        content: `import 'package:dio/dio.dart';

class BoutiqueApiClient {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'https://api.opticalize.com/v1',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'X-App-Tenant': 'hq-optic-alize',
    },
  ));

  Future<List<dynamic>> fetchBoutiques() async {
    try {
      final response = await _dio.get('/branches');
      return response.data['data'] as List<dynamic>;
    } on DioException catch (e) {
      throw Exception('Erreur de consolidation réseau : \${e.message}');
    }
  }

  Future<Map<String, dynamic>> createBoutique(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/branches', data: data);
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception('Erreur d\\'initialisation de la succursale : \${e.response?.data["error"] ?? e.message}');
    }
  }

  Future<Map<String, dynamic>> updateBoutique(String id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/branches/\$id', data: data);
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception('Erreur de mise à jour boutique : \${e.response?.data["error"] ?? e.message}');
    }
  }

  Future<void> deleteBoutique(String id) async {
    try {
      await _dio.delete('/branches/\$id');
    } on DioException catch (e) {
      throw Exception('Erreur d\\'expulsion du réseau : \${e.message}');
    }
  }
}`
      },
      {
        name: 'boutique_service.dart',
        path: 'flutter/lib/services/boutique_service.dart',
        language: 'dart',
        module: 'Super Admin HQ',
        layer: 'domain',
        type: 'service',
        description: 'Service applicatif orchestrant l\'accès aux données locales et distantes des boutiques.',
        content: `import 'boutique_api_client.dart';

class BoutiqueService {
  final BoutiqueApiClient _apiClient = BoutiqueApiClient();

  Future<List<dynamic>> getBoutiques() async {
    return await _apiClient.fetchBoutiques();
  }

  Future<Map<String, dynamic>> createBoutique(Map<String, dynamic> raw) async {
    return await _apiClient.createBoutique(raw);
  }

  Future<Map<String, dynamic>> updateBoutique(String id, Map<String, dynamic> raw) async {
    return await _apiClient.updateBoutique(id, raw);
  }

  Future<void> deleteBoutique(String id) async {
    await _apiClient.deleteBoutique(id);
  }
}`
      },
      {
        name: 'boutique_provider.dart',
        path: 'flutter/lib/providers/boutique_provider.dart',
        language: 'dart',
        module: 'Super Admin HQ',
        layer: 'presentation',
        type: 'provider',
        description: 'Gestionnaire d\'état Riverpod (StateNotifier) pour synchroniser, modifier et filtrer les succursales.',
        content: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/boutique_service.dart';

class BoutiqueState {
  final List<dynamic> boutiques;
  final bool isLoading;
  final String? errorMessage;

  BoutiqueState({
    required this.boutiques,
    this.isLoading = false,
    this.errorMessage,
  });

  BoutiqueState copyWith({
    List<dynamic>? boutiques,
    bool? isLoading,
    String? errorMessage,
  }) {
    return BoutiqueState(
      boutiques: boutiques ?? this.boutiques,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class BoutiqueNotifier extends StateNotifier<BoutiqueState> {
  final BoutiqueService _service;

  BoutiqueNotifier(this._service) : super(BoutiqueState(boutiques: [])) {
    loadBoutiques();
  }

  Future<void> loadBoutiques() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final list = await _service.getBoutiques();
      state = state.copyWith(boutiques: list, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<bool> addBoutique(Map<String, dynamic> raw) async {
    try {
      state = state.copyWith(isLoading: true);
      final addedObj = await _service.createBoutique(raw);
      state = state.copyWith(
        boutiques: [...state.boutiques, addedObj],
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  Future<bool> updateBoutique(String id, Map<String, dynamic> raw) async {
    try {
      state = state.copyWith(isLoading: true);
      final updatedObj = await _service.updateBoutique(id, raw);
      state = state.copyWith(
        boutiques: state.boutiques.map((b) => b['id'] == id ? updatedObj : b).toList(),
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  Future<void> setBoutiqueStatus(String id, String status) async {
    try {
      await _service.updateBoutique(id, {'status': status});
      state = state.copyWith(
        boutiques: state.boutiques.map((b) {
          if (b['id'] == id) {
            final copy = Map<String, dynamic>.from(b);
            copy['status'] = status;
            return copy;
          }
          return b;
        }).toList(),
      );
    } catch (_) {}
  }

  Future<void> removeBoutique(String id) async {
    try {
      await _service.deleteBoutique(id);
      state = state.copyWith(
        boutiques: state.boutiques.where((b) => b['id'] != id).toList(),
      );
    } catch (_) {}
  }
}

final boutiqueServiceProvider = Provider((ref) => BoutiqueService());
final boutiqueProvider = StateNotifierProvider<BoutiqueNotifier, BoutiqueState>((ref) {
  return BoutiqueNotifier(ref.watch(boutiqueServiceProvider));
});`
      },
      {
        name: 'boutique_validation.dart',
        path: 'flutter/lib/validators/boutique_validation.dart',
        language: 'dart',
        module: 'Super Admin HQ',
        layer: 'domain',
        type: 'service',
        description: 'Règles et fonctions de validation de formulaire de boutique (Code, Raison sociale, Emails, Directeurs).',
        content: `class BoutiqueValidation {
  static String? validateCode(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Le code de boutique est requis.';
    }
    final regex = RegExp(r'^OA-[A-Z0-9]+-\\d+$', caseSensitive: false);
    if (!regex.hasMatch(value.trim())) {
      return 'Format requis: OA-XXX-YY (ex: OA-DKR-01).';
    }
    return null;
  }

  static String? validateName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'La raison sociale est requise.';
    }
    if (value.trim().length < 3) {
      return 'La raison sociale doit faire au moins 3 caractères.';
    }
    return null;
  }

  static String? validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'L\\'e-mail institutionnel est requis.';
    }
    final regex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\$');
    if (!regex.hasMatch(value.trim())) {
      return 'Format d\\'adresse e-mail invalide.';
    }
    return null;
  }

  static String? validatePhone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Le téléphone direct est requis.';
    }
    final regex = RegExp(r'^\\+?[0-9\\s\\-()]{5,20}\$');
    if (!regex.hasMatch(value.trim())) {
      return 'Numéro invalide (caractères autorisés : +, chiffres, espaces, tirets).';
    }
    return null;
  }
}`
      },
      {
        name: 'boutique_list_page.dart',
        path: 'flutter/lib/pages/boutique_list_page.dart',
        language: 'dart',
        module: 'Super Admin HQ',
        layer: 'presentation',
        type: 'service',
        description: 'Page Flutter affichant la liste des boutiques avec recherche active et contrôles de désactivation/archivage.',
        content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/boutique_provider.dart';
import 'boutique_form_page.dart';

class BoutiqueListPage extends ConsumerWidget {
  const BoutiqueListPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(boutiqueProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('RÉSEAU OPTIC ALIZÉ', style: TextStyle(fontWeight: FontWeight.black, fontSize: 13, letterSpacing: 1)),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: Colors.blueAccent),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BoutiqueFormPage())),
          )
        ],
      ),
      body: state.isLoading 
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: state.boutiques.length,
              itemBuilder: (context, idx) {
                final b = state.boutiques[idx];
                final status = b['status'] ?? 'Actif';
                
                return Card(
                  elevation: 2,
                  margin: const EdgeInsets.only(bottom: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          justifyAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(6)),
                              child: Text(b['code'] ?? '', style: const TextStyle(fontWeight: FontWeight.black, color: Colors.blue, fontSize: 11)),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: status == 'Actif' ? Colors.green[50] : Colors.amber[50],
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                status,
                                style: TextStyle(color: status == 'Actif' ? Colors.green[700] : Colors.amber[800], fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            )
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(b['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B))),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.location_on, size: 14, color: Colors.grey),
                            const SizedBox(width: 4),
                            Text('\${b["city"] ?? ""}, \${b["address"] ?? ""}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton.icon(
                              icon: const Icon(Icons.edit, size: 14),
                              label: const Text('MODIFIER', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => BoutiqueFormPage(boutique: b))),
                            ),
                            TextButton.icon(
                              icon: const Icon(Icons.archive, size: 14, color: Colors.purple),
                              label: Text(status == 'Archivé' ? 'ARCHIVÉ' : 'ARCHIVER', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.purple)),
                              onPressed: status == 'Archivé' ? null : () => ref.read(boutiqueProvider.notifier).setBoutiqueStatus(b['id'], 'Archivé'),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_forever, color: Colors.redAccent, size: 18),
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  builder: (_) => AlertDialog(
                                    title: const Text('Supprimer la boutique ?'),
                                    content: const Text('Cette action expulsera définitivement cette boutique du groupe.'),
                                    actions: [
                                      TextButton(child: const Text('ANNULER'), onPressed: () => Navigator.pop(context)),
                                      TextButton(child: const Text('SUPPRIMER', style: TextStyle(color: Colors.red)), onPressed: () {
                                        ref.read(boutiqueProvider.notifier).removeBoutique(b['id']);
                                        Navigator.pop(context);
                                      }),
                                    ],
                                  ),
                                );
                              },
                            )
                          ],
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}`
      },
      {
        name: 'boutique_form_page.dart',
        path: 'flutter/lib/pages/boutique_form_page.dart',
        language: 'dart',
        module: 'Super Admin HQ',
        layer: 'presentation',
        type: 'service',
        description: 'Formulaire Flutter validé sous Riverpod pour la création et le contrôle direct des boutiques.',
        content: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/boutique_provider.dart';
import '../validators/boutique_validation.dart';

class BoutiqueFormPage extends ConsumerStatefulWidget {
  final Map<String, dynamic>? boutique;
  const BoutiqueFormPage({Key? key, this.boutique}) : super(key: key);

  @override
  _BoutiqueFormPageState createState() => _BoutiqueFormPageState();
}

class _BoutiqueFormPageState extends ConsumerState<BoutiqueFormPage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _codeCtrl;
  late TextEditingController _nameCtrl;
  late TextEditingController _cityCtrl;
  late TextEditingController _addressCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;

  @override
  void initState() {
    super.initState();
    _codeCtrl = TextEditingController(text: widget.boutique?['code'] ?? 'OA-');
    _nameCtrl = TextEditingController(text: widget.boutique?['name'] ?? '');
    _cityCtrl = TextEditingController(text: widget.boutique?['city'] ?? '');
    _addressCtrl = TextEditingController(text: widget.boutique?['address'] ?? '');
    _emailCtrl = TextEditingController(text: widget.boutique?['email'] ?? '');
    _phoneCtrl = TextEditingController(text: widget.boutique?['phone'] ?? '');
  }

  @override
  void dispose() {
    _codeCtrl.dispose();
    _nameCtrl.dispose();
    _cityCtrl.dispose();
    _addressCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.boutique != null;
    return Scaffold(
      appBar: AppBar(title: Text(isEditing ? 'MODIFIER LA SUCURSALE' : 'OUVRIR UNE SUCURSALE')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(18),
          children: [
            TextFormField(controller: _codeCtrl, decoration: const InputDecoration(labelText: 'Code Boutique *'), validator: BoutiqueValidation.validateCode),
            const SizedBox(height: 12),
            TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Raison sociale *'), validator: BoutiqueValidation.validateName),
            const SizedBox(height: 12),
            TextFormField(controller: _cityCtrl, decoration: const InputDecoration(labelText: 'Ville locale *')),
            const SizedBox(height: 12),
            TextFormField(controller: _addressCtrl, decoration: const InputDecoration(labelText: 'Adresse physique *')),
            const SizedBox(height: 12),
            TextFormField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email institutionnel *'), validator: BoutiqueValidation.validateEmail),
            const SizedBox(height: 12),
            TextFormField(controller: _phoneCtrl, decoration: const InputDecoration(labelText: 'Téléphone direct *'), validator: BoutiqueValidation.validatePhone),
            const SizedBox(height: 30),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(isEditing ? 'SAUVEGARDER LES MOTIFS' : 'INITIALISER LA BOUTIQUE', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              onPressed: () async {
                if (_formKey.currentState!.validate()) {
                  final data = {
                    'code': _codeCtrl.text.toUpperCase(),
                    'name': _nameCtrl.text,
                    'city': _cityCtrl.text,
                    'address': _addressCtrl.text,
                    'email': _emailCtrl.text,
                    'phone': _phoneCtrl.text,
                    'zone_id': widget.boutique?['zone_id'] ?? 'ZONE-UEMOA',
                    'status': widget.boutique?['status'] ?? 'Actif',
                  };
                  bool success;
                  if (isEditing) {
                    success = await ref.read(boutiqueProvider.notifier).updateBoutique(widget.boutique!['id'], data);
                  } else {
                    success = await ref.read(boutiqueProvider.notifier).addBoutique(data);
                  }
                  if (success) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Succès : Enregistré au siège central.'))
                    );
                    Navigator.pop(context);
                  }
                }
              },
            )
          ],
        ),
      ),
    );
  }
}`
      },
      {
        name: 'hq_schema_migration_postgres.sql',
        path: 'database/migrations/hq_schema_migration_postgres.sql',
        language: 'sql',
        module: 'Super Admin HQ',
        layer: 'database',
        type: 'schema',
        description: 'Migration SQL pour provisionner les tables Zones et Branches avec clés étrangères, contraintes d\'intégrité et index.',
        content: `-- ==========================================
-- ARCHITECTURE CENTRALISÉE OPTIC ALIZÉ ERP
-- CRÉATION DU COMPOSANT CENTRAL MULTI-SUCCURSALES
-- ==========================================

-- Activer l'extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des Zones Géographiques
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    currency VARCHAR(10) DEFAULT 'XOF',
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    status VARCHAR(50) DEFAULT 'Actif' NOT NULL,
    CONSTRAINT check_zone_status CHECK (status IN ('Actif', 'Inactif'))
);

-- Crée un index sur le code pour les lookups d'orchestration
CREATE INDEX IF NOT EXISTS idx_zones_code ON zones(code);

-- 2. Table des Succursales Filles (Branches)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    logo TEXT,
    manager_id VARCHAR(100),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    language VARCHAR(10) NOT NULL DEFAULT 'FR',
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    status VARCHAR(50) DEFAULT 'Actif' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Contraintes d'intégrité référentielle & cascade
    CONSTRAINT fk_branch_zone FOREIGN KEY (zone_id) 
        REFERENCES zones(id) 
        ON DELETE RESTRICT,
        
    -- Contrainte métier des codes de succursales
    CONSTRAINT check_branch_status CHECK (status IN ('Actif', 'Fermé', 'Audit', 'Inactif', 'Archivé'))
);

-- Index pour accélérer le filtrage et la consolidation automatique au siège
CREATE INDEX IF NOT EXISTS idx_branches_zone ON branches(zone_id);
CREATE INDEX IF NOT EXISTS idx_branches_city ON branches(city);
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);

-- 3. Table de Sélection Dynamique des Modules (branch_modules)
CREATE TABLE IF NOT EXISTS branch_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Cascade d'intégrité : supprimer les modules si la boutique est supprimée
    CONSTRAINT fk_branch_modules_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) 
        ON DELETE CASCADE,
        
    -- Contrainte d'unicité métier
    CONSTRAINT uq_branch_module UNIQUE (branch_id, module_name)
);

-- Indexation de branch_modules pour des requêtes de menus ultra-fluides
CREATE INDEX IF NOT EXISTS idx_branch_modules_branch ON branch_modules(branch_id);`
      }
    ];
    onAddGeneratedFiles(generatedBlueprints);
    setBlueprintsExported(true);
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION WITH REAL-TIME CONSOLE METRICS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-950 text-white rounded-3xl shadow-xl border border-slate-900/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-linear-to-bl from-blue-600/10 to-indigo-600/0 pointers-event-none" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-md uppercase tracking-wider animate-pulse">
              Architecture Centralisée
            </span>
            <span className="text-[10px] font-mono text-slate-400">Siège Centralisé</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight font-display text-white">
            CONSOLE DE SUPERADMINISTRATION OPTIC ALIZÉ
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Management unifié des points de vente régionaux, consolidation en temps réel des transactions et Clean Architecture.
          </p>
        </div>
        
        {/* Export Blueprint CTA */}
        <button
          onClick={handleTriggerExportCode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer shadow-md ${
            blueprintsExported 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {blueprintsExported ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Blueprints & Migrations Déployés !</span>
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              <span>Déployer Schéma SQL & Repositories</span>
            </>
          )}
        </button>
      </div>

      {/* SEGMENTED TAB SELECTOR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-1">
        {[
          { id: 'kpis', label: 'Indicateurs Globaux', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'boutiques', label: 'Créer une Agence', icon: <Building2 className="w-4 h-4" /> },
          { id: 'sales', label: 'Ventes Consolidées', icon: <ShoppingCart className="w-4 h-4" /> },
          { id: 'employees', label: 'Fiches RH Réseau', icon: <Briefcase className="w-4 h-4" /> },
          { id: 'users', label: 'Utilisateurs & CRM Accès', icon: <Users className="w-4 h-4" /> },
          { id: 'organization', label: 'Configuration Client & Logo', icon: <Sliders className="w-4 h-4" /> },
          { id: 'db_schema', label: 'Spécification DDL PostgreSQL', icon: <Code className="w-4 h-4" /> },
          { id: 'backups', label: 'Sauvegarde & Backups', icon: <Database className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                isActive 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/20' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-100/80'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- Tab 1: KPIs & Consolidated Stats --- */}
      {activeTab === 'kpis' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* MAIN 8-KPI GRID LAYOUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* KPI 1 : Chiffre d'Affaires Global */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl border border-blue-500 shadow-md text-white flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black tracking-widest text-blue-100/90 block">Chiffre d'Affaires Canaux</span>
                  <div className="text-xl font-black font-mono leading-none">{totalConsolidatedTurnoverFCFA.toLocaleString()} FCFA</div>
                </div>
                <div className="p-2.5 bg-white/10 text-white rounded-xl">
                  <TrendingUp className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] text-blue-100/70 font-mono">
                  Soit ~{(totalConsolidatedTurnoverFCFA / 655.957).toLocaleString(undefined, { maximumFractionDigits: 0 })} € parité fixe
                </span>
                <span className="text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  +12.4% vs 2025
                </span>
              </div>
            </div>

            {/* KPI 2 : Bénéfice Global */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">Bénéfice Net Global</span>
                  <div className="text-xl font-black text-slate-800 font-mono leading-none">{totalProfitFCFA.toLocaleString()} FCFA</div>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-semibold">
                  Marge brute moyenne : <strong className="text-emerald-600">{( (totalProfitFCFA / totalConsolidatedTurnoverFCFA)*100 ).toFixed(1)}%</strong>
                </span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  Optimisé
                </span>
              </div>
            </div>

            {/* KPI 3 : Dépenses Globales */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">Dépenses Cumulées Réseau</span>
                  <div className="text-xl font-black text-slate-800 font-mono leading-none">{totalExpensesFCFA.toLocaleString()} FCFA</div>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                <span className="truncate">Achats verres/montures + Salaires + Logistique</span>
                <span className="text-rose-600 font-mono font-bold text-[9px] shrink-0 ml-1">
                  -2.4% budget
                </span>
              </div>
            </div>

            {/* KPI 4 : Ventes du Jour */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">Ventes du Jour (13 Juin)</span>
                  <div className="text-xl font-black text-blue-600 font-mono leading-none">{salesTodayVolumeFCFA.toLocaleString()} FCFA</div>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-medium">Facturation active en boutiques</span>
                <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono">
                  {salesTodayCount} Vtes
                </span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* KPI 5 : Commandes Labo en Attente */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">Commandes en attente Labo</span>
                  <div className="text-xl font-black text-amber-700 font-mono leading-none">{pendingOrdersVolumeFCFA.toLocaleString()} FCFA</div>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-medium">Fiches d'usinage verres centralisées</span>
                <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  {pendingOrdersCount} en cours
                </span>
              </div>
            </div>

            {/* KPI 6 : Nombre total de boutiques */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">Succursales Connectées</span>
                  <div className="text-xl font-black text-slate-800 font-mono leading-none">{totalBoutiquesCount} Boutiques</div>
                </div>
                <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Isolation SaaS unifiée</span>
                <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {activeBranchCount} Actives
                </span>
              </div>
            </div>

            {/* KPI 7 : Nombre d'employés */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">Effectif Global Marque</span>
                  <div className="text-xl font-black text-slate-800 font-mono leading-none">{workforceCount} Salariés</div>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Directeurs, Opticiens & Monteurs</span>
                <span className="text-[9px] text-slate-400 font-mono font-bold">Base synchronisée</span>
              </div>
            </div>

            {/* KPI 8 : Nombre de Clients */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block">Clients Uniques Réseau</span>
                  <div className="text-xl font-black text-slate-800 font-mono leading-none">{totalClientCount} Patients</div>
                </div>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Globe className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Dossiers de réfraction rattachés</span>
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded">
                  Actifs 100%
                </span>
              </div>
            </div>

          </div>

          {/* CLASSEMENTS & AUDITS : TOP BOUTIQUES & TOP VENDEURS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COMPONENT: TOP BOUTIQUES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Top Boutiques par Performance
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Répartition consolidée du chiffre d'affaires global.</p>
                </div>
                <span className="text-[9px] font-bold text-slate-400 font-mono uppercase bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                  Devise : FCFA (XOF)
                </span>
              </div>

              <div className="space-y-3.5 my-2">
                {topBranchesRanking.map((b, index) => {
                  const contributionPct = totalConsolidatedTurnoverFCFA > 0 
                    ? Math.round((b.revenueFCFA / totalConsolidatedTurnoverFCFA) * 100) 
                    : 0;
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏢';
                  
                  return (
                    <div key={b.id} className="space-y-1.5 p-2 rounded-xlhover:bg-slate-50/50 transition">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-sm shrink-0">{medal}</span>
                          <div>
                            <span className="font-extrabold text-slate-700 block text-[11px] leading-tight">{b.city}</span>
                            <span className="text-[9px] text-slate-400 block truncate max-w-[200px]" title={b.name}>{b.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-700 block font-mono text-[11px]">{b.revenueFCFA.toLocaleString()} FCFA</span>
                          <span className="text-[9px] text-slate-400 block font-mono">{b.transactionCount} transactions</span>
                        </div>
                      </div>
                      
                      {/* Custom Contribution Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-indigo-500' : 'bg-slate-400'
                            }`} 
                            style={{ width: `${contributionPct}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-slate-500 font-mono w-8 text-right shrink-0">{contributionPct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COMPONENT: TOP VENDEURS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Classement des Conseillers (Vendeurs Actifs)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Ventes individuelles rattachées aux opticiens et directeurs locaux.</p>
                </div>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded font-mono uppercase">
                  KPI de Productivité
                </span>
              </div>

              <div className="space-y-3.5 my-2 max-h-[300px] overflow-y-auto pr-1">
                {topSellersRanking.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Aucun historique de vente rattaché aux conseillers actuellement.
                  </div>
                ) : (
                  topSellersRanking.map((v, index) => {
                    const statusMedal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
                    return (
                      <div 
                        key={v.name} 
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg shrink-0">{statusMedal}</span>
                          <div>
                            <span className="font-extrabold text-slate-700 block text-[11px] leading-tight">{v.name}</span>
                            <span className="text-[9px] text-slate-400 font-semibold block">{v.position} — <strong className="text-blue-600">{v.branchName}</strong></span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-black text-slate-700 block text-[11px]">{v.revenueFCFA.toLocaleString()} FCFA</span>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-mono inline-block mt-0.5">
                            {v.salesCount} ventes
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* 4 GRAPHICS BENTO PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-2">
            
            {/* CHART 1: MONTHLY SALES DEVELOPMENT */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Évolution Mensuelle des Ventes (CA Consolidé)
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Progression du volume de vente mensuel converti globalement pour 2026.</p>
              </div>
              <div className="h-64 font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPerformanceChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: any) => [
                        `${value.toLocaleString()} FCFA`, 
                        'Chiffre d\'Affaires'
                      ]}
                      contentStyle={{ fontFamily: 'monospace', fontSize: '10px', borderRadius: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="CA" fill="#2563EB" radius={[4, 4, 0, 0]} name="Chiffre d'affaires consolidé" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 2: PROFIT VS EXPENSES CURVES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Courbe des Bénéfices vs Dépenses Globales
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Suivi comparé de la rentabilité opérationnelle nette et des charges cumulées.</p>
              </div>
              <div className="h-64 font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyPerformanceChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${value.toLocaleString()} FCFA`, 
                        name === 'Benefice' ? 'Bénéfice Net' : 'Charges / Dépenses'
                      ]}
                      contentStyle={{ fontFamily: 'monospace', fontSize: '10px', borderRadius: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" dataKey="Benefice" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name="Bénéfice Net net" />
                    <Area type="monotone" dataKey="Depenses" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorExpenses)" name="Dépenses / Charges d'exploitation" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 3: RELATIVE COMPARISON IN UNIFIED FCFA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  Comparaison entre Boutiques (Unifié XOF)
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Comparatif direct exprimé en devises consolidées d'Afrique de l'Ouest.</p>
              </div>
              <div className="h-64 font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchComparisonChartData} layout="vertical" margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" stroke="#94A3B8" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" stroke="#94A3B8" />
                    <Tooltip 
                      formatter={(v: any) => [`${v.toLocaleString()} FCFA`, 'Chiffre d\'Affaires']}
                      contentStyle={{ fontFamily: 'monospace', fontSize: '10px', borderRadius: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="CA" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="C.A. Local Converti" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 4: ANNUAL EVOLUTION AND TREND PROJECTIONS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100/55 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-600" />
                  Évolution Annuelle & Projections Réseau (2024 - 2026)
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Croissance multilatérale de l'enseigne et projection linéaire 2026.</p>
              </div>
              <div className="h-64 font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={annualEvolutionChartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="annee" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${value.toLocaleString()} FCFA`,
                        name === 'CA' ? 'Chiffre d\'affaires' : name === 'Benefice' ? 'Bénéfice Net' : 'Charges'
                      ]}
                      contentStyle={{ fontFamily: 'monospace', fontSize: '10px', borderRadius: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="CA" stroke="#2563EB" strokeWidth={3} activeDot={{ r: 6 }} name="CA Global" />
                    <Line type="monotone" dataKey="Benefice" stroke="#10B981" strokeWidth={2} name="Bénéfice consolidé" />
                    <Line type="monotone" dataKey="Depenses" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 5" name="Dépenses d'exploitation" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* REAL TIME PENDING LAB ORDERS VIEWER PANEL */}
          <div className="bg-white border border-slate-100/55 rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Inbox className="w-4 h-4 text-amber-500" />
                  File d'Attente Interactive des Commandes de Laboratoire (Usinage & Trait.)
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Statut des verres ophtalmiques en fabrication ou modification chez les verriers partenaires.</p>
              </div>
              <span className="text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full">
                Secteur Centralisé
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-extrabold uppercase bg-slate-50/50">
                    <th className="py-2.5 px-3">Numéro ID</th>
                    <th className="py-2.5 px-3">Boutique émettrice</th>
                    <th className="py-2.5 px-3">Spécifications Lorgnon / Verres</th>
                    <th className="py-2.5 px-3">Date de Commande</th>
                    <th className="py-2.5 px-3 text-right">Montant</th>
                    <th className="py-2.5 px-3 text-center">Statut Actuel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {hqPendingOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{ord.id}</td>
                      <td className="py-2.5 px-3 font-extrabold text-slate-700">
                        {branches.find(b => b.id === ord.branch_id)?.city || 'Réseau'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-medium max-w-sm truncate" title={ord.details}>
                        {ord.details}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{ord.date}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                        {ord.amount.toLocaleString()} {ord.currency}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black rounded-full ${
                          ord.status.includes('Validation') 
                            ? 'bg-amber-100 text-amber-800' 
                            : ord.status.includes('Expédition') 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-indigo-100 text-indigo-850'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clean Architecture Alert Box */}
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-150 text-blue-800 flex gap-4 items-center">
            <Shield className="w-10 h-10 text-blue-600 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">Standard de Résilience et Intégrité du Siège</h4>
              <p className="text-xs text-blue-900/80 leading-relaxed font-semibold">
                Tous les flux de données transistan par notre système centralisés respectent strictement le patron de conception Repository Pattern. L'isolation de Tenant reste inviolable lors du stockage PostgreSQL, et les requêtes analytiques transversales utilisent des vues indexées multi-zones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 2: Manage Boutiques & Zones --- */}
      {activeTab === 'boutiques' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Zones Géographiques & Agences</h3>
              <p className="text-xs text-slate-500">Créer et affecter les nouvelles agences du réseau dans l'architecture centralisée.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => setShowAddZoneModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Créer Zone</span>
              </button>
              <button 
                onClick={() => {
                  if (zones.length === 0) return triggerAlert('Zone Requise', 'Veuillez d\'abord créer au moins une zone géographique dans le système !');
                  setShowAddBranchModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une Agence</span>
              </button>
            </div>
          </div>

          {/* Filters shelf for boutiques */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/55 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
              {/* Search bar specifically for Boutiques */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtrer par nom, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-100/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status filter selection */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Statut :</span>
                <select 
                  value={branchFilterStatus}
                  onChange={(e) => setBranchFilterStatus(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 bg-white border border-slate-100/80 rounded-xl text-xs text-slate-600 focus:outline-none"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif / Désactivé</option>
                  <option value="Fermé">Fermé</option>
                  <option value="Audit">Audit</option>
                  <option value="Archivé">Archivé</option>
                </select>
              </div>
            </div>

            {/* Toggle show archived checkbox */}
            <div className="flex items-center gap-2 shrink-0 select-none">
              <input 
                type="checkbox" 
                id="toggleArchivedChecked"
                checked={showArchivedBranches}
                onChange={(e) => setShowArchivedBranches(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="toggleArchivedChecked" className="text-xs font-bold text-slate-600 cursor-pointer">
                Afficher les archives d'enseigne
              </label>
            </div>
          </div>

          {/* Sub-sections layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Zones column (1 part) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Zones Actives</h4>
              </div>

              {zones.map(z => (
                <div 
                  key={z.id}
                  className={`p-5 rounded-2xl border transition ${
                    z.status === 'Actif' 
                      ? 'bg-white border-slate-100 hover:border-blue-150' 
                      : 'bg-slate-50 border-slate-100/80 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[9px] font-bold text-slate-400 block">{z.code}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                      z.status === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {z.status}
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-slate-800 mt-1 uppercase tracking-tight">{z.name}</h5>
                  <p className="text-[10px] text-slate-500 mt-1">{z.description}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100/80 flex justify-between items-center text-[10px] font-bold text-slate-600">
                    <span className="flex items-center gap-1 font-mono">
                      💱 {z.currency} / TVA {z.tax_rate}%
                    </span>
                    <button 
                      onClick={() => handleDeleteZone(z.id)}
                      disabled={z.status !== 'Actif'}
                      className="text-slate-400 hover:text-rose-600 transition cursor-pointer disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Branches column (2 parts) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Liste des Agences Contrôlées</h4>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100/55 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="p-4">{currentLanguage === 'FR' ? 'Code & Nom de l\'Agence' : 'Agency Name & Code'}</th>
                      <th className="p-4">{currentLanguage === 'FR' ? 'Localisation' : 'Location'}</th>
                      <th className="p-4">{currentLanguage === 'FR' ? 'Contact' : 'Contact'}</th>
                      <th className="p-4">{currentLanguage === 'FR' ? 'Modules Activés' : 'Active Modules'}</th>
                      <th className="p-4 text-center">{currentLanguage === 'FR' ? 'Statut' : 'Status'}</th>
                      <th className="p-4 text-right">{currentLanguage === 'FR' ? 'Actions' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {branches
                      .filter(b => {
                        if (b.status === 'Archivé' && !showArchivedBranches && branchFilterStatus !== 'Archivé') {
                          return false;
                        }
                        if (branchFilterStatus !== 'ALL' && b.status !== branchFilterStatus) {
                          return false;
                        }
                        if (searchQuery !== '') {
                          const query = searchQuery.toLowerCase();
                          return b.name.toLowerCase().includes(query) || 
                                 b.code.toLowerCase().includes(query) || 
                                 b.city.toLowerCase().includes(query) || 
                                 b.address.toLowerCase().includes(query);
                        }
                        return true;
                      })
                      .map(b => {
                        const z = zones.find(zone => zone.id === b.zone_id);
                        return (
                          <tr key={b.id} className="hover:bg-slate-50 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 text-[9px] font-black bg-blue-50 text-blue-600 rounded">
                                  {b.code}
                                </span>
                                <span className="font-extrabold text-slate-900 uppercase">
                                  {b.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-1">Zone: {z ? z.name : 'N/A'}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-slate-705 font-medium">{b.address}</span>
                              <span className="text-slate-400 block font-semibold text-[10px]">{b.city}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-slate-705 font-medium">{b.phone}</span>
                              <span className="text-slate-400 block font-mono text-[10px] lowercase truncate max-w-[140px]">{b.email}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1 max-w-[190px]">
                                {(() => {
                                  const activeM = branchModules.filter(bm => bm.branch_id === b.id && bm.is_enabled);
                                  if (activeM.length === 0) {
                                    return <span className="text-[8px] text-rose-500 font-bold bg-rose-50 px-1 py-0.5 rounded border border-rose-200">Aucun</span>;
                                  }
                                  return activeM.map(bm => (
                                    <span key={bm.id} className="text-[8px] font-extrabold tracking-tight text-blue-800 bg-blue-50 border border-blue-150 px-1 rounded" title={bm.module_name}>
                                      {bm.module_name === 'dashboard' ? '📊 HQ' :
                                       bm.module_name === 'crm' ? '👤 CRM' :
                                       bm.module_name === 'clinique' ? '🩺 CLINIC' :
                                       bm.module_name === 'products' ? '👓 STOCK' :
                                       bm.module_name === 'commande' ? '📦 LAB' :
                                       bm.module_name === 'orders' ? '🛒 POS' :
                                       bm.module_name === 'journal' ? '📓 FISC' :
                                       bm.module_name === 'websockets' ? '💬 CHAT' :
                                       bm.module_name === 'revenue' ? '📈 COMPTA' :
                                       bm.module_name === 'reports' ? '📋 KPIS' :
                                       bm.module_name === 'hr' ? '👥 RH' :
                                       bm.module_name === 'gestion_optic' ? '⚙️ ATELIER' : '⚙️ SETTINGS'}
                                    </span>
                                  ));
                                })()}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                b.status === 'Actif' 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-250/50' 
                                  : b.status === 'Inactif'
                                  ? 'bg-slate-100 text-slate-600 border border-slate-100/80'
                                  : b.status === 'Archivé'
                                  ? 'bg-purple-50 text-purple-600 border border-purple-200/50'
                                  : b.status === 'Audit' 
                                  ? 'bg-amber-50 text-amber-600 border border-amber-200/50' 
                                  : 'bg-red-50 text-rose-600 border border-rose-220/50'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => handleOpenEditBranch(b)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                                  title="Modifier"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {b.status === 'Actif' ? (
                                  <button 
                                    onClick={() => handleDeactivateBranch(b.id)}
                                    className="p-1 text-slate-450 hover:text-amber-650 hover:bg-slate-100 rounded transition cursor-pointer"
                                    title="Désactiver"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleActivateBranch(b.id)}
                                    className="p-1 text-emerald-500 hover:text-emerald-750 hover:bg-slate-100 rounded transition cursor-pointer"
                                    title="Activer"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {b.status !== 'Archivé' ? (
                                  <button 
                                    onClick={() => handleArchiveBranch(b.id)}
                                    className="p-1 text-purple-500 hover:text-purple-750 hover:bg-slate-100 rounded transition cursor-pointer"
                                    title="Archiver"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-purple-400 font-extrabold uppercase p-1">ARC</span>
                                )}
                                <button 
                                  onClick={() => handleRealDeleteBranch(b.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 3: Consolidated Sales --- */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Toutes les Ventes du Réseau</h3>
            <p className="text-xs text-slate-500">Flux transactionnel global consolidé. Chaque ligne de donnée contient obligatoirement <code className="px-1.5 py-0.5 bg-slate-100 rounded text-rose-600">zone_id</code> et <code className="px-1.5 py-0.5 bg-slate-100 rounded text-rose-600">branch_id</code>.</p>
          </div>

          {/* Filtering Layout */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/55 flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher par patient, ID Facture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-100/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Dropdown Filters */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <select 
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-100/80 rounded-xl text-xs text-slate-600 focus:outline-none"
              >
                <option value="ALL">Toutes les Zones</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>

              <select 
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-100/80 rounded-xl text-xs text-slate-600 focus:outline-none"
              >
                <option value="ALL">Toutes les Boutiques</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sales Table Visualizer */}
          <div className="bg-white border border-slate-100/55 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100/55 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="p-4">ID Facture</th>
                    <th className="p-4">Zone ID</th>
                    <th className="p-4">Boutique (Branch ID)</th>
                    <th className="p-4">Client Patient</th>
                    <th className="p-4 text-right">Montant Local</th>
                    <th className="p-4 text-right">Équivalent FCFA</th>
                    <th className="p-4">Date Vente</th>
                    <th className="p-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold">
                  {filteredSales.map((s) => {
                    const branch = branches.find(b => b.id === s.branch_id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono text-[11px] font-bold text-blue-600">{s.id}</td>
                        <td className="p-4 font-mono text-[10px] text-slate-400">{s.zone_id}</td>
                        <td className="p-4">
                          <div className="text-slate-800 font-bold">{branch?.name.split('-')[1]?.trim() || s.branch_id}</div>
                          <span className="text-[9px] font-mono font-bold text-slate-400 block">{s.branch_id}</span>
                        </td>
                        <td className="p-4">{s.customerName}</td>
                        <td className="p-4 text-right font-bold text-slate-900">
                          {s.amount.toLocaleString()} {s.currency}
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-700 font-mono">
                          {eurToFcfa(s.amount, s.currency).toLocaleString()} FCFA
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-500">{s.date}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            s.status === 'Payé' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                        Aucune vente enregistrée avec ces filtres.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 4: Consolidated Employees --- */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Ressources Humaines du Réseau</h3>
            <p className="text-xs text-slate-500">Analyse de la force de vente et du personnel optométriste actif dans le réseau, géré depuis le siège.</p>
          </div>

          {/* Filtering Layout */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/55 flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher par nom de collaborateur, poste..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-100/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Dropdown Filters */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <select 
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-100/80 rounded-xl text-xs text-slate-600 focus:outline-none"
              >
                <option value="ALL">Toutes les Zones</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>

              <select 
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-100/80 rounded-xl text-xs text-slate-600 focus:outline-none"
              >
                <option value="ALL">Toutes les Boutiques</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map(emp => {
              const branch = branches.find(b => b.id === emp.branch_id);
              const isEURStaff = emp.id.includes('PAR');
              return (
                <div key={emp.id} className="bg-white p-5 rounded-2xl border border-slate-100/55 hover:border-blue-150 shadow-xs flex items-start gap-4">
                  <div className="h-10 w-10 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center shrink-0 uppercase">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-[10px] text-blue-600 font-bold uppercase">{emp.position}</p>
                      <p className="text-[9px] font-mono text-slate-400 truncate">{emp.email}</p>
                    </div>

                    <div className="space-y-1 text-[10px] pt-2 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Section :</span>
                        <span className="text-slate-700 font-bold uppercase">{emp.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Succursale rattachée :</span>
                        <span className="text-slate-700 font-bold truncate">
                          {branch?.name.split('-')[1]?.trim() || emp.branch_id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Salaire :</span>
                        <span className="text-emerald-700 font-bold font-mono">
                          {emp.salary.toLocaleString()} {isEURStaff ? 'EUR' : 'FCFA'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-400">
                      <span>Réf: {emp.id}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md uppercase font-bold tracking-wider">
                        {emp.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Tab 5: SaaS Users (Fused inside Super Admin Console) --- */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Habilitations & Accès CRM Utilisateurs</h3>
            <p className="text-xs text-slate-500 font-medium">Gérez les comptes d'employés, rôles de caisse et les modules d'ateliers activés pour chaque profil de l'enseigne Alizé.</p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xs">
            <SaaSUsers 
              darkMode={darkMode} 
              currentLanguage={currentLanguage} 
              currentUserEmail={currentUserEmail} 
              createdBoutiques={branches} 
              users={users}
              setUsers={setUsers}
            />
          </div>
        </div>
      )}

      {/* --- Tab 6: Tenant and Organization Config (Fused inside Super Admin Console) --- */}
      {activeTab === 'organization' && (
        <div className="space-y-6 animate-fade-in font-sans text-xs">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Configuration & Isolation Multi-Tenant</h3>
            <p className="text-xs text-slate-500 font-medium">Administrez l'isolement SaaS, l'identité visuelle de votre réseau national et la licence d'exploitation active.</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-6">
            {/* Logo Upload Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-5 items-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center font-display font-black text-white text-2xl shadow-md shrink-0 overflow-hidden relative">
                {appLogo ? (
                  <img src={appLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  "OA"
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Logo de l'Enseigne (SaaS Alizé Corporate Logo)</span>
                <p className="text-[10px] text-slate-500 font-medium">Formats acceptés : PNG, JPEG, SVG. Résolution recommandée : 200x200px.</p>
                
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition select-none shadow-xs">
                  <span>Téléverser un logo d'entreprise</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setAppLogo(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {appLogo && (
                  <button 
                    type="button"
                    onClick={() => setAppLogo('')}
                    className="ml-3 text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer underline"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Nom d'entreprise (Tenant Name)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100/80 bg-slate-50/55 focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Email de Contact Officiel</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100/80 bg-slate-50/55 focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Téléphone de Contact Officiel</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100/80 bg-slate-50/55 focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Domaine d'organisation (Multi-Maison)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100/80 bg-slate-50/55 focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                  value={orgDomain}
                  onChange={(e) => setOrgDomain(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Licence ERP active (HQ Validée)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs rounded-xl text-slate-550 bg-slate-100 cursor-not-allowed border border-slate-100/55"
                  value={orgLicence}
                  disabled
                />
              </div>
            </div>
            
            <div className="rounded-xl bg-blue-50/75 border border-blue-150 p-4 text-xs text-blue-800 flex gap-2">
              <CheckCircle className="w-5 h-5 shrink-0 text-blue-600" />
              <div>
                <p className="font-bold">Hébergement en Isolation Multi-Tenant</p>
                <p className="mt-1 leading-relaxed text-[11px] text-blue-700">Votre organisation utilise un schéma de base de données PostgreSQL isolé par clé de partitionement (Tenant Partition Key). Toute modification affecte instantanément l'ensemble de vos succursales connectées.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 7: Database Schema & Source Codes --- */}
      {activeTab === 'db_schema' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">PostgreSQL & Spécifications de l'Architecture</h3>
            <p className="text-xs text-slate-500">Blueprint d'ingénierie pour le provisionnement relationnel SQL, les modèles métiers et le Repository Pattern appliqué.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Migration Script */}
            <div className="bg-slate-950 p-6 rounded-2xl text-white space-y-4 font-mono text-xs overflow-x-auto border border-slate-900/20">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-900/20 pb-3 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 font-sans">
                  <Database className="w-4 h-4 text-blue-400" />
                  Migration Script PostgreSQL (DDL)
                </span>
                <span>v1.2-SUPERADMIN</span>
              </div>
              
              <pre className="text-[10px] text-blue-100 leading-relaxed font-semibold">
{`-- Create tables for central HQ management
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    currency VARCHAR(10) DEFAULT 'XOF',
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    status VARCHAR(50) DEFAULT 'Actif' NOT NULL,
    CONSTRAINT check_zone_status CHECK (status IN ('Actif', 'Inactif'))
);

CREATE INDEX IF NOT EXISTS idx_zones_code ON zones(code);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    logo TEXT,
    manager_id VARCHAR(100),
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    language VARCHAR(10) NOT NULL DEFAULT 'FR',
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    status VARCHAR(50) DEFAULT 'Actif' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_branch_zone FOREIGN KEY (zone_id) 
        REFERENCES zones(id) ON DELETE RESTRICT,
    CONSTRAINT check_branch_status CHECK (status IN ('Actif', 'Fermé', 'Audit'))
);

CREATE INDEX IF NOT EXISTS idx_branches_zone ON branches(zone_id);`}
              </pre>
            </div>

            {/* Column 2: Architecture Explanation */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100/55 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Mise en Œuvre de la Clean Architecture
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Le système d'information central de <strong>Optic Alizé</strong> est scindé en 4 couches concentriques étanches :
                </p>
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 text-xs leading-relaxed">
                    <span className="h-6 w-6 font-mono text-xs font-black bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0">1</span>
                    <div>
                      <span className="font-bold block text-slate-900">Entities (Noyau)</span>
                      Les invariants de la chaîne optique (les zones, les branches avec leurs coordonnées fiscales, managers, devises).
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 text-xs leading-relaxed">
                    <span className="h-6 w-6 font-mono text-xs font-black bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0">2</span>
                    <div>
                      <span className="font-bold block text-slate-900">Repository Pattern (Port & Adapteurs)</span>
                      Nous isolons la communication de la base de données PostgreSQL via des interfaces abstraites de Repository. Idéal pour passer de SQLite locale, à PostgreSQL ou Firebase d'un coup.
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 text-xs leading-relaxed">
                    <span className="h-6 w-6 font-mono text-xs font-black bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">3</span>
                    <div>
                      <span className="font-bold block text-slate-900">Use Cases (Contrôle Siège)</span>
                      Les scripts d'arbitrage de performance, l'alignement des taxes de zones lors d'un EDI de transfert transfrontalier.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 8: Backups & System Maintenance --- */}
      {activeTab === 'backups' && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div className="space-y-1 text-left">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sauvegarde &amp; Backups Système</h3>
            <p className="text-xs text-slate-500 font-medium">Gérez la sécurité de vos données de production. Effectuez des clichés de l'état du réseau, importez des configurations et procédez aux maintenances préventives.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left side: Backups list and controls */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Box 1: Create a snapshot */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-50 pb-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Créer un cliché de sauvegarde</h4>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Nom personnalisé de la sauvegarde (ex: Cliché Avant Inventaire)"
                      value={newBackupName}
                      onChange={(e) => setNewBackupName(e.target.value)}
                      className="w-full bg-slate-55/60 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <button
                    onClick={() => handleCreateBackup()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm border-0 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer Cliché</span>
                  </button>
                </div>
              </div>

              {/* Box 2: Backups List */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Clipboard className="w-5 h-5 text-slate-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Vos points de restauration enregistrés</h4>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono font-semibold">
                    {backups.length} Cliché(s)
                  </span>
                </div>

                {backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 font-mono gap-3 border border-dashed border-slate-150 rounded-xl">
                    <Database className="w-8 h-8 text-slate-300 animate-pulse" />
                    <span className="text-xs text-slate-500 font-semibold">Aucun point de restauration disponible localement</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {backups.map((backup) => (
                      <div 
                        key={backup.id}
                        className="p-4 bg-slate-50/45 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200 transition"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-800 block">{backup.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span>Créé le: {backup.createdAt}</span>
                            <span>•</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wider text-[8.5px] font-bold">
                              {backup.id.startsWith('backup-imported') ? 'Importé' : 'Local'}
                            </span>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button
                            onClick={() => handleRestoreBackup(backup)}
                            title="Restaurer l'application à cet état exact"
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer border-0 transition flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Restaurer</span>
                          </button>
                          <button
                            onClick={() => handleDownloadBackup(backup)}
                            title="Télécharger la sauvegarde sous forme de fichier JSON"
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold cursor-pointer border-0 transition flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Exporter</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.id)}
                            title="Supprimer définitivement ce cliché"
                            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition border-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right side: File import & Factory Reset */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Import File box */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-50 pb-3">
                  <Download className="w-5 h-5 text-[#0097a7] transform rotate-180" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Importer une sauvegarde</h4>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sélectionnez un fichier <code className="px-1 bg-slate-50 border border-slate-100 rounded">.json</code> précédemment exporté depuis Alizé pour le réinjecter dans vos points de restauration disponibles.
                  </p>
                  
                  <div className="relative border-2 border-dashed border-slate-150 rounded-xl p-4 text-center hover:bg-slate-50/50 transition cursor-pointer">
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportBackup}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1 text-slate-400">
                      <Plus className="w-5 h-5 mx-auto text-[#0097a7]" />
                      <span className="text-[11px] font-bold block text-slate-600">Choisir ou Glisser le fichier</span>
                      <span className="text-[9.5px] block">JSON uniquement</span>
                    </div>
                  </div>

                  {backupFileError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-[10.5px] font-mono leading-tight">
                      {backupFileError}
                    </div>
                  )}
                </div>
              </div>

              {/* Administrative Factory Reset box */}
              <div className="p-5 rounded-2xl border border-red-100 bg-red-50/20 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-rose-800 border-b border-rose-100/50 pb-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">Zone de Sécurité : Reset d'Usine</h4>
                </div>

                <div className="space-y-3 text-xs text-left">
                  <p className="text-[11px] text-rose-900/80 leading-relaxed font-sans font-medium">
                    Cette action est définitive et détruit irréversiblement l'intégralité des données en base (Réseaux, Agences, KPI, Catalogues, Ventes, Clients et Fiches RH) pour repartir d'un système vierge sans aucune donnée d'origine ou jeu d'essai. Les compteurs seront intégralement remis à zéro.
                  </p>

                  <label className="flex items-start gap-2.5 p-2.5 bg-white border border-red-100 rounded-xl cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      id="confirmResetCheckbox"
                      className="w-3.5 h-3.5 text-rose-600 border-red-200 rounded focus:ring-rose-500 cursor-pointer mt-0.5"
                      checked={resetConfirmed}
                      onChange={(e) => setResetConfirmed(e.target.checked)}
                    />
                    <span className="text-[10px] font-bold text-rose-900/90 leading-tight">Je confirme vouloir purger définitivement toutes les données.</span>
                  </label>

                  <button
                    type="button"
                    disabled={!resetConfirmed}
                    onClick={handleSystemReset}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition duration-250 flex items-center justify-center gap-2 border-0 ${
                      resetConfirmed 
                        ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md' 
                        : 'bg-slate-150 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Réinitialisation d'Usine</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- ADD ZONE MODAL --- */}
      {showAddZoneModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-2xl space-y-6 border border-slate-100"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Créer une Nouvelle Zone d'Expansion
              </h3>
              <button onClick={() => setShowAddZoneModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Code de la Zone *</label>
                  <input 
                    type="text" 
                    placeholder="ex: ZONE-UEMOA"
                    value={newZoneCode}
                    onChange={(e) => setNewZoneCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Nom de la Région *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Zone Ouest Francophone"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Description Métier</label>
                <textarea 
                  placeholder="Enjeux douaniers et succursales de rattachement..."
                  value={newZoneDesc}
                  onChange={(e) => setNewZoneDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Devise Principale</label>
                  <select 
                    value={newZoneCurrency}
                    onChange={(e) => setNewZoneCurrency(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl"
                  >
                    <option value="FCFA">FCFA (XOF/XAF)</option>
                    <option value="EUR">Euros (EUR)</option>
                    <option value="USD">Dollars (USD)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Taux de TVA Standard (%)</label>
                  <input 
                    type="number" 
                    value={newZoneTax}
                    onChange={(e) => setNewZoneTax(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowAddZoneModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold cursor-pointer"
                >
                  Ajouter Zone
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- ADD BRANCH MODAL --- */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white p-6 rounded-2xl shadow-2xl space-y-4 border border-slate-100 my-auto max-h-[95vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 animate-pulse" />
                Initialiser une Nouvelle Succursale (Boutique) - Mode Paysage
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddBranchModal(false)} 
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs text-left">
              {/* Colonne Gauche : Identité, Adresses & Paramètres Financiers (Landscape grid) */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Identité de l'Établissement &amp; Données Fiscales</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Rattachement Zone Géographique *</label>
                    <select 
                      value={newBranchZone}
                      onChange={(e) => setNewBranchZone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl cursor-pointer"
                    >
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Code ID Succursale *</label>
                    <input 
                      type="text" 
                      placeholder="ex: OA-DKR-03"
                      value={newBranchCode}
                      onChange={(e) => setNewBranchCode(e.target.value)}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.code ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                    />
                    {validationErrors.code && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.code}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Raison Sociale Complète *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Optic Alizé Mali - Bamako Hamdallaye"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.name ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                  />
                  {validationErrors.name && (
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Adresse Physique Complète</label>
                    <input 
                      type="text" 
                      placeholder="ex: Boulevard de la Paix, Immeuble Alizé"
                      value={newBranchAddress}
                      onChange={(e) => setNewBranchAddress(e.target.value)}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.address ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                    />
                    {validationErrors.address && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.address}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Téléphone Direct</label>
                    <input 
                      type="text" 
                      placeholder="ex: +223 20 22 11 00"
                      value={newBranchPhone}
                      onChange={(e) => setNewBranchPhone(e.target.value)}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.phone ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                    />
                    {validationErrors.phone && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">E-mail Institutionnel</label>
                    <input 
                      type="email" 
                      placeholder="ex: bamako@opticalize.com"
                      value={newBranchEmail}
                      onChange={(e) => setNewBranchEmail(e.target.value)}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.email ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                    />
                    {validationErrors.email && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Directeur de Succursale</label>
                    <input 
                      type="text" 
                      placeholder="ex: EMP-BAM-01"
                      value={newBranchManager}
                      onChange={(e) => setNewBranchManager(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Devise de Vente</label>
                    <input 
                      type="text" 
                      value={newBranchCurrency}
                      onChange={(e) => setNewBranchCurrency(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">TVA Locale (%)</label>
                    <input 
                      type="number" 
                      value={newBranchTax}
                      onChange={(e) => setNewBranchTax(Number(e.target.value))}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.tax_rate ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                    />
                    {validationErrors.tax_rate && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.tax_rate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Colonne Droite : Sélection des Modules & Actions de validation (Landscape-oriented) */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100/55">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Modules Rattachés</h4>
                      <p className="text-[9px] text-slate-500 font-medium">Activer ou exclure des fonctionnalités</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const allVal = Object.values(newBranchModules).every(v => v);
                        const output: { [key: string]: boolean } = {};
                        ALL_AVAILABLE_MODULES.forEach(m => {
                          output[m.id] = !allVal;
                        });
                        setNewBranchModules(output);
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition select-none"
                    >
                      {Object.values(newBranchModules).every(v => v) ? 'Aucun' : 'Tous'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-[295px] overflow-y-auto p-1.5 bg-slate-100/20 border border-slate-100/55 rounded-xl">
                    {ALL_AVAILABLE_MODULES.map(m => (
                      <label 
                        key={m.id} 
                        className="flex items-start gap-2.5 p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-100 transition cursor-pointer select-none"
                      >
                        <input 
                          type="checkbox"
                          checked={!!newBranchModules[m.id]}
                          onChange={(e) => setNewBranchModules(prev => ({ ...prev, [m.id]: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer mt-0.5"
                        />
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-700 block">{m.label}</span>
                          <span className="text-[9px] text-slate-400 block leading-tight">{m.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setShowAddBranchModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-205 transition"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold cursor-pointer transition shadow-sm"
                  >
                    Initialiser Succursale
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- EDIT BRANCH MODAL --- */}
      {showEditBranchModal && editingBranch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white p-6 rounded-2xl shadow-2xl space-y-4 border border-slate-100 my-auto max-h-[95vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600 animate-pulse" />
                Mettre à Jour la Succursale - {editingBranch.code} (Mode Paysage)
              </h3>
              <button 
                type="button"
                onClick={() => { setShowEditBranchModal(false); setEditingBranch(null); }} 
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs text-left">
              {/* Colonne Gauche : Identité & Paramètres Généraux */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Identité de l'Établissement &amp; Configuration Logistique</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Rattachement Zone Géographique *</label>
                    <select 
                      value={editBranchZone}
                      onChange={(e) => setEditBranchZone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl cursor-pointer"
                    >
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Code ID Succursale *</label>
                    <input 
                      type="text" 
                      placeholder="ex: OA-DKR-03"
                      value={editBranchCode}
                      onChange={(e) => setEditBranchCode(e.target.value)}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.code ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                    />
                    {validationErrors.code && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.code}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Raison Sociale Complète *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Optic Alizé Mali - Bamako Hamdallaye"
                    value={editBranchName}
                    onChange={(e) => setEditBranchName(e.target.value)}
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.name ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                  />
                  {validationErrors.name && (
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Adresse Physique Complète</label>
                    <input 
                      type="text" 
                      placeholder="ex: Boulevard de la Paix, Immeuble Alizé"
                      value={editBranchAddress}
                      onChange={(e) => setEditBranchAddress(e.target.value)}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.address ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                    />
                    {validationErrors.address && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.address}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Téléphone Direct</label>
                    <input 
                      type="text" 
                      placeholder="ex: +223 20 22 11 00"
                      value={editBranchPhone}
                      onChange={(e) => setEditBranchPhone(e.target.value)}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.phone ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                    />
                    {validationErrors.phone && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">E-mail Institutionnel</label>
                    <input 
                      type="email" 
                      placeholder="ex: bamako@opticalize.com"
                      value={editBranchEmail}
                      onChange={(e) => setEditBranchEmail(e.target.value)}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.email ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                    />
                    {validationErrors.email && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 font-semibold">
                  <div className="space-y-1.5 col-span-1">
                    <label className="font-bold text-slate-700">Directeur</label>
                    <input 
                      type="text" 
                      placeholder="ex: EMP-BAM-01"
                      value={editBranchManager}
                      onChange={(e) => setEditBranchManager(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <label className="font-bold text-slate-700">Devise</label>
                    <input 
                      type="text" 
                      value={editBranchCurrency}
                      onChange={(e) => setEditBranchCurrency(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <label className="font-bold text-slate-700">TVA (%)</label>
                    <input 
                      type="number" 
                      value={editBranchTax}
                      onChange={(e) => setEditBranchTax(Number(e.target.value))}
                      className={`w-full p-2.5 bg-slate-50 border rounded-xl ${validationErrors.tax_rate ? "border-rose-500 focus:ring-rose-500" : "border-slate-100/80"}`}
                    />
                    {validationErrors.tax_rate && (
                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{validationErrors.tax_rate}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <label className="font-bold text-slate-700 font-sans">Statut</label>
                    <select 
                      value={editBranchStatus}
                      onChange={(e) => setEditBranchStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-100/80 rounded-xl font-bold font-sans text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Inactif">Inactif</option>
                      <option value="Fermé">Fermé</option>
                      <option value="Audit">Audit</option>
                      <option value="Archivé">Archivé</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Colonne Droite : Sélection des Modules & Actions d'Édition */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100/55">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Modules Rattachés</h4>
                      <p className="text-[9px] text-slate-500 font-medium">Activer ou exclure des fonctionnalités</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const allVal = Object.values(editBranchModules).every(v => v);
                        const output: { [key: string]: boolean } = {};
                        ALL_AVAILABLE_MODULES.forEach(m => {
                          output[m.id] = !allVal;
                        });
                        setEditBranchModules(output);
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition select-none"
                    >
                      {Object.values(editBranchModules).every(v => v) ? 'Aucun' : 'Tous'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-[295px] overflow-y-auto p-1.5 bg-slate-100/20 border border-slate-100/55 rounded-xl">
                    {ALL_AVAILABLE_MODULES.map(m => (
                      <label 
                        key={m.id} 
                        className="flex items-start gap-2.5 p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-100 transition cursor-pointer select-none"
                      >
                        <input 
                          type="checkbox"
                          checked={!!editBranchModules[m.id]}
                          onChange={(e) => setEditBranchModules(prev => ({ ...prev, [m.id]: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer mt-0.5"
                        />
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-700 block">{m.label}</span>
                          <span className="text-[9px] text-slate-400 block leading-tight">{m.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => { setShowEditBranchModal(false); setEditingBranch(null); }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-205 transition"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold cursor-pointer transition shadow-sm"
                  >
                    Sauvegarder les modifications
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- IN-UI CUSTOM CONFIRM / ALERT MODAL --- */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fade-in text-xs font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl space-y-4 border border-slate-100 text-left"
          >
            <div className="flex items-center gap-2.5 text-slate-800 pb-2 border-b border-slate-100">
              <Shield className={`w-5 h-5 ${confirmDialog.actionType === 'alert_only' ? 'text-blue-400' : 'text-rose-500'}`} />
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">{confirmDialog.title}</h4>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              {confirmDialog.message}
            </p>

            {confirmDialog.actionType === 'reset_all' && (
              <div className="space-y-2 py-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Mot de passe Administrateur / Créateur
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    value={resetPassword}
                    onChange={(e) => {
                      setResetPassword(e.target.value);
                      setResetError(null);
                    }}
                    placeholder="Saisir votre mot de passe pour confirmer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider select-none transition"
                  >
                    {showResetPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
                {resetError && (
                  <p className="text-[10px] font-semibold text-rose-600 animate-pulse">
                    {resetError}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2.5">
              {confirmDialog.actionType === 'alert_only' ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    if (confirmDialog.title === "Système Réinitialisé") {
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition text-xs"
                >
                  Compris
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      executeConfirmedAction();
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer transition text-xs shadow-xs"
                  >
                    Confirmer l'action
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* --- REINITIALISATION SYSTEME PROGRESS OVERLAY --- */}
      {resetProgress !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in text-xs font-sans text-slate-800">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 text-center space-y-6">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                Réinitialisation en Cours
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Veuillez ne pas fermer cette fenêtre
              </p>
            </div>

            {/* Progress bar container */}
            <div className="space-y-2">
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
                <div 
                  style={{ width: `${resetProgress}%` }}
                  className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-full transition-all duration-100"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-rose-600 uppercase tracking-wider px-1">
                <span>Progression</span>
                <span>{resetProgress}%</span>
              </div>
            </div>

            {/* Dynamic Status Text */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl min-h-[50px] flex items-center justify-center">
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed text-center animate-pulse">
                {resetProgressText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
