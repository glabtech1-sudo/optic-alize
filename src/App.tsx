import React, { useState, useEffect } from 'react';
// @ts-ignore
import defaultLogo from './assets/images/optic_alize_logo_1781336757710.jpg';
import { initialArchFiles } from './data/architectureFiles';
import { extraArchFiles } from './data/extraArchitectureFiles';
import { ArchFile } from './types/architecture';
import { preloadLogoAndWatermark } from './utils/logoPreloader';
import { fetchUsers, logoutUser } from './lib/api';

// Import our gorgeous newly created SaaS Views
import LoginPage from './components/LoginPage';
import MainDashboard from './components/MainDashboard';
import SaaSUsers from './components/SaaSUsers';
import SaaSOrders from './components/SaaSOrders';
import SaaSProducts from './components/SaaSProducts';
import SaaSReports from './components/SaaSReports';
import SaaSSettings from './components/SaaSSettings';
import CliniqueModule from './components/CliniqueModule';
import SAVModule from './components/SAVModule';
import FidelisationSAVModule from './components/FidelisationSAVModule';
import CommandeModule from './components/CommandeModule';
import JournalModule from './components/JournalModule';
import GestionOpticModule from './components/GestionOpticModule';
import SuperAdminHQModule from './components/SuperAdminHQModule';
import SuperAdminMonitor from './components/SuperAdminMonitor';

// Import original modular sub-systems for fallback and reference
import CRMModule from './components/CRMModule';
import CalendarModal from './components/CalendarModal';
import AccountingModule from './components/AccountingModule';
import HRModule from './components/HRModule';
import PresenceModule from './components/PresenceModule';
import ArchitectureBlueprint from './components/ArchitectureBlueprint';
import CodeWorkspace from './components/CodeWorkspace';
import DatabaseExplorer from './components/DatabaseExplorer';
import WebSocketSimulator from './components/WebSocketSimulator';
import AIAssistant from './components/AIAssistant';
import DesignSystem from './components/DesignSystem';

// Import Lucide standard icons
import { 
  BarChart3, Users, ShoppingCart, Package, DollarSign, Settings, LogOut, 
  Search, Bell, User, Sun, Moon, Sparkles, Layers, Code, Database, Zap, 
  Sliders, ChevronRight, HelpCircle, Heart, Lock, CheckCircle, Compass, MessageSquare, Globe,
  ClipboardList, BookOpen, Building2, Calendar, UserCheck, Award, Smartphone, DownloadCloud, Wifi, WifiOff,
  Menu, X, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type SaasTab = 
  | 'dashboard' 
  | 'users' 
  | 'orders' 
  | 'revenue' 
  | 'products' 
  | 'reports' 
  | 'settings' 
  | 'logout'
  | 'design_system'
  | 'fidelisation_sav'
  | 'fidelisation'
  | 'pos'
  | 'accounting'
  | 'hr'
  | 'blueprint'
  | 'code'
  | 'database'
  | 'websockets'
  | 'ai'
  | 'clinique'
  | 'presence'
  | 'sav'
  | 'commande'
  | 'journal'
  | 'gestion_optic'
  | 'super_admin_hq'
  | 'super_admin_monitor';

const companiesList = [
  { id: 'GLAB', name: 'Optic Alizé - Dépôt Central', currency: 'XOF', taxRate: 18, symbol: 'FCFA' }
];

export default function App() {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [files, setFiles] = useState<ArchFile[]>([...initialArchFiles, ...extraArchFiles]);
  const [activeTab, setActiveTab] = useState<SaasTab>('dashboard');
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState<'FR' | 'EN'>(
    () => (localStorage.getItem('optic_app_language') as 'FR' | 'EN') || 'FR'
  );
  useEffect(() => {
    localStorage.setItem('optic_app_language', currentLanguage);
  }, [currentLanguage]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [pwaInstalledAlert, setPwaInstalledAlert] = useState<boolean>(false);

  // Monitor Network Connectivity & Trap PWA installation triggers
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent standard chrome infobar, save event and mark workspace as installable
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setPwaInstalledAlert(true);
      setTimeout(() => setPwaInstalledAlert(false), 9000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the PWA installation');
      setIsInstallable(false);
    } else {
      console.log('User dismissed the PWA installation');
    }
    setDeferredPrompt(null);
  };

  // Auto-close mobile drawer menu on active tab selection
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeTab]);

  const [currentCompany, setCurrentCompany] = useState(companiesList[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);

  const [selectedThemeAccent, setSelectedThemeAccent] = useState<'blue' | 'indigo' | 'slate' | 'emerald'>(
    () => (localStorage.getItem('optic_theme_accent') as any) || 'blue'
  );

  const [companyEmail, setCompanyEmail] = useState(
    () => localStorage.getItem('optic_company_email') || 'contact@opticalize.com'
  );

  const [companyPhone, setCompanyPhone] = useState(
    () => localStorage.getItem('optic_company_phone') || '+228 90 00 00 00'
  );

  const [appLogo, setAppLogo] = useState(
    () => localStorage.getItem('optic_app_logo') || defaultLogo
  );

  useEffect(() => {
    localStorage.setItem('optic_theme_accent', selectedThemeAccent);
  }, [selectedThemeAccent]);

  useEffect(() => {
    localStorage.setItem('optic_company_email', companyEmail);
  }, [companyEmail]);

  useEffect(() => {
    localStorage.setItem('optic_company_phone', companyPhone);
  }, [companyPhone]);

  useEffect(() => {
    localStorage.setItem('optic_app_logo', appLogo);
    preloadLogoAndWatermark(appLogo);
  }, [appLogo]);

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.setItem('optic_is_authenticated', 'false');
      setIsAuthenticated(false);
    };
    window.addEventListener('optic-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('optic-unauthorized', handleUnauthorized);
    };
  }, []);

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(
    () => localStorage.getItem('optic_user_email') || 'glabtech1@opticalize.com'
  );

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Synced User Database
  const [users, setUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('optic_users');
    const defaults = [
      { id: 'USR-01', name: 'Administrateur Optic Alizé', email: 'glabtech1@opticalize.com', role: 'Admin', status: 'Active', phone: '+221 77 124 55 93', location: 'Optic Alizé Dépôt Central', lastActive: 'Just now', allowedBoutiques: ['Optic Alizé - Dépôt Central'], allowedModules: ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'sav', 'hr'], password: 'Gildas@00741' },
      { id: 'USR-GILDAS', name: 'Gildas Concepteur', email: 'anges.gildas@opticalizé.com', role: 'Admin', status: 'Active', phone: '+221 77 124 55 93', location: 'Optic Alizé - Dépôt Central', lastActive: 'Just now', allowedBoutiques: ['Optic Alizé - Dépôt Central'], allowedModules: ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'sav', 'hr'], password: 'Gildas@00741' },
      { id: 'USR-GILDAS-ALT', name: 'Gildas Concepteur Alt', email: 'anges.gildas@opticalize.com', role: 'Admin', status: 'Active', phone: '+221 77 124 55 93', location: 'Optic Alizé - Dépôt Central', lastActive: 'Just now', allowedBoutiques: ['Optic Alizé - Dépôt Central'], allowedModules: ['dashboard', 'fidelisation', 'orders', 'commande', 'products', 'revenue', 'journal', 'gestion_optic', 'clinique', 'sav', 'hr'], password: 'Gildas@00741' }
    ];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter((u: any) => 
            u && u.email &&
            (u.email.toLowerCase() === 'glabtech1@opticalize.com' ||
             u.email.toLowerCase() === 'anges.gildas@opticalizé.com' ||
             u.email.toLowerCase() === 'anges.gildas@opticalize.com')
          );
          if (clean.length === 0) return defaults;
          localStorage.setItem('optic_users', JSON.stringify(clean));
          return clean;
        }
      } catch (e) {}
    }
    localStorage.setItem('optic_users', JSON.stringify(defaults));
    return defaults;
  });

  useEffect(() => {
    // Load synced users from PostgreSQL DB (or fallback cache) on startup
    fetchUsers().then(data => {
      if (data && data.length > 0) {
        setUsers(data);
      }
    }).catch(err => console.warn("Failed to load PostgreSQL synced users on startup:", err));
  }, []);

  useEffect(() => {
    localStorage.setItem('optic_users', JSON.stringify(users));
  }, [users]);

  // Preseeded employee default roster for seamless mock operations & synchronized biometrics
  const SEED_EMPLOYEES = [];

  // Synced HR Employees - fallback seeds to SEED_EMPLOYEES on first launch
  const [hrEmployees, setHrEmployees] = useState<any[]>(() => {
    const saved = localStorage.getItem('optic_hr_employees');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    if (localStorage.getItem('optic_system_factory_reset') === 'true') {
      return [];
    }
    // First time launch: save & return the preseeded employees
    localStorage.setItem('optic_hr_employees', JSON.stringify(SEED_EMPLOYEES));
    return SEED_EMPLOYEES;
  });

  useEffect(() => {
    localStorage.setItem('optic_hr_employees', JSON.stringify(hrEmployees));
    window.dispatchEvent(new Event('storage'));
  }, [hrEmployees]);

  const isSuperAdmin = currentUserEmail === 'glabtech1@gmail.com' || 
                       currentUserEmail === 'glabtech1@opticalize.com' || 
                       currentUserEmail === 'anges.gildas@gmail.com' || 
                       currentUserEmail === 'anges.gildas@opticalizé.com' ||
                       currentUserEmail === 'anges.gildas@opticalize.com' ||
                       (users.find(u => u?.email === currentUserEmail)?.role === 'Super Admin');

  // Get dynamic allowed modules based on current company context & active user (Affectation dynamique & sélection de modules)
  const isModuleEnabledForCompany = (moduleId: string, companyId: string) => {
    if (isSuperAdmin) return true;
    if (['dashboard', 'clinique', 'hr', 'fidelisation', 'fidelisation_sav', 'presence'].includes(moduleId)) return true;
    const saved = localStorage.getItem('optic_hq_branch_modules');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const branchId = 'BR-CENTRAL';
          const found = list.find((bm: any) => bm.branch_id === branchId && bm.module_name === moduleId);
          if (found) {
            return found.is_enabled;
          }
        }
      } catch (e) {}
    }
    return true; // default true if config is missing
  };

  const loggedInUserRaw = users.find(u => u.email === currentUserEmail);
  const loggedInUser = loggedInUserRaw || (isSuperAdmin ? {
    id: 'USR-BYPASS-' + (currentUserEmail.includes('glabtech') ? 'GLAB' : 'GILD'),
    name: currentUserEmail.includes('glabtech') ? 'Glabtech1 Super Admin' : 'Anges Gildas Super Admin',
    email: currentUserEmail,
    role: 'Admin',
    status: 'Active',
    phone: '+221 77 124 55 93',
    location: 'Optic Alizé - Dépôt Central',
    lastActive: 'Just now',
    allowedBoutiques: ['Optic Alizé - Dépôt Central'],
    allowedModules: ['dashboard', 'fidelisation', 'fidelisation_sav', 'clinique', 'products', 'commande', 'orders', 'journal', 'websockets', 'revenue', 'reports', 'hr', 'presence', 'gestion_optic', 'settings', 'super_admin_hq', 'dev_portal', 'super_admin_monitor']
  } : undefined);
  const userAllowedModules = loggedInUser ? (loggedInUser.allowedModules || []) : [];

  const isUserAdminInDirection = React.useMemo(() => {
    if (!loggedInUser) return false;
    if (isSuperAdmin) return true;
    if (loggedInUser.role !== 'Admin') return false;
    const boutique = (loggedInUser.allowedBoutiques && loggedInUser.allowedBoutiques.length > 0)
      ? loggedInUser.allowedBoutiques[0]
      : (loggedInUser.location || '');
    const bUpper = boutique.toUpperCase();
    return bUpper.includes('DÉPÔT CENTRAL') || 
           bUpper.includes('DEPOT CENTRAL') || 
           bUpper.includes('DIRECTION');
  }, [loggedInUser, isSuperAdmin]);

  const getUserBoutiqueSuffix = () => {
    if (!loggedInUser) return '';
    const boutique = (loggedInUser.allowedBoutiques && loggedInUser.allowedBoutiques.length > 0)
      ? loggedInUser.allowedBoutiques[0]
      : (loggedInUser.location || '');
    if (!boutique) return '';
    
    // Remove brand prefix if it already exists, so we don't duplicate it
    let cleanBoutique = boutique.replace(/^(Optic Alizé|OPTIQUE ALIZE)\s*(-\s*)?/i, '');
    // Remove any parentheses
    cleanBoutique = cleanBoutique.replace(/[()]+/g, '').trim();
    
    if (!cleanBoutique) return '';
    
    const isDirection = cleanBoutique.toUpperCase() === 'DÉPÔT CENTRAL' || 
                        cleanBoutique.toUpperCase() === 'DEPOT CENTRAL' || 
                        cleanBoutique.toUpperCase() === 'DIRECTION';
    if (isDirection) {
      return ' DIRECTION';
    } else {
      return ` ${cleanBoutique.toUpperCase()}`;
    }
  };

  useEffect(() => {
    localStorage.setItem('optic_user_email', currentUserEmail);
    if (!isSuperAdmin) {
      const devTabs = ['blueprint', 'code', 'database', 'websockets', 'ai', 'design_system'];
      if (devTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [currentUserEmail, isSuperAdmin, activeTab]);

  // Synchronize CSS class for dark mode (forced to light mode for maximum legibility on a white background)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleAddGeneratedFiles = (newFiles: ArchFile[]) => {
    setFiles((prev) => {
      const filteredPrev = prev.filter((p) => !newFiles.some((n) => n.path === p.path));
      return [...filteredPrev, ...newFiles];
    });
  };

  // Dynamically yield breadcrumb labels based on selected tab
  const getBreadcrumb = () => {
    const isFR = currentLanguage === 'FR';
    switch (activeTab) {
      case 'dashboard': return { category: 'Console', current: isFR ? 'Tableau de Bord' : 'Dashboard' };
      case 'users': return { category: isFR ? 'Membres' : 'Members', current: isFR ? 'Utilisateurs & Fidélisation Accès' : 'Users & Loyalty Settings' };
      case 'orders': return { category: isFR ? 'Opérations' : 'Operations', current: isFR ? 'Commandes POS' : 'POS Checkout Orders' };
      case 'commande': return { category: isFR ? 'Flux Atelier' : 'Lab Workflow', current: isFR ? 'Commandes de Verres / Montures' : 'Lens & Frame Laboratory Orders' };
      case 'journal': return { category: isFR ? 'Trésorerie' : 'Cash Desk', current: isFR ? "Pointage Journal d'activité" : 'Daily Activity Cash Journal' };
      case 'gestion_optic': return { category: isFR ? 'Atelier Optique' : 'Optical Lab', current: isFR ? 'Gestion Optic & Stocks' : 'Optic Fitting & Stock Ledger' };
      case 'revenue': return { category: isFR ? 'Trésorerie' : 'Treasury', current: isFR ? 'Comptabilité & Trésorerie' : 'Accounting & Bank Clearing' };
      case 'products': return { category: isFR ? 'Inventaire' : 'Inventory', current: isFR ? 'Catalogue Optic' : 'Optical Catalog & Stock' };
      case 'reports': return { category: isFR ? 'Analyses' : 'Analytics', current: isFR ? 'Audits & reports' : 'System Logs & Audits' };
      case 'settings': return { category: isFR ? 'Système' : 'System', current: isFR ? 'Paramètres' : 'Boutique Settings' };
      case 'clinique': return { category: isFR ? 'Opération' : 'Clinical', current: isFR ? 'Clinique & Prescription' : 'Clinical Refraction & prescription' };
      case 'sav': return { category: isFR ? 'Atelier' : 'After-Sales', current: isFR ? 'Service Après-Vente (SAV)' : 'S.A.V. Service & Warranty' };
      case 'logout': return { category: isFR ? 'Fermeture' : 'Session', current: isFR ? 'Quitter Session' : 'Exit Session / Logout' };
      case 'blueprint': return { category: 'Architecture', current: isFR ? 'Schéma Conceptuel' : 'Conceptual Blueprint' };
      case 'code': return { category: 'Code', current: isFR ? 'Espace de Travail' : 'Workspace Developer Tree' };
      case 'database': return { category: isFR ? 'Données' : 'Database', current: isFR ? 'Base PostgreSQL' : 'Local Postgres schema' };
      case 'websockets': return { category: 'Console Live', current: isFR ? 'WebSockets Live' : 'Live Hot WebSockets' };
      case 'ai': return { category: isFR ? 'IA Générative' : 'Generative AI', current: isFR ? 'Orchestrateur Clean' : 'Gemini AI Assistant' };
      case 'fidelisation_sav': return { category: isFR ? 'Relation Client' : 'Relations', current: isFR ? 'Fidélisation & S.A.V' : 'Loyalty & After-Sales' };
      case 'fidelisation': return { category: 'ERP Classique', current: isFR ? 'Client & Registre' : 'Client & Register' };
      case 'pos': return { category: 'ERP Classique', current: isFR ? 'Caisse POS (Ventes)' : 'Standard POS Checkout' };
      case 'accounting': return { category: 'ERP Classique', current: isFR ? 'Comptabilité Traditionnelle' : 'General Ledger Ledger' };
      case 'hr': return { category: 'ERP Classique', current: isFR ? 'Ressources Humaines' : 'Human Resources Registry' };
      case 'design_system': return { category: 'Design', current: isFR ? 'Styleguide MD3' : 'Material You MD3 design tokens' };
      case 'super_admin_monitor': return { category: 'Super Admin', current: isFR ? 'Supervision HQ' : 'Sovereign Monitoring HQ' };
      default: return { category: 'SaaS Platform', current: 'Console' };
    }
  };

  const getSelectedAccentColor = () => {
    switch (selectedThemeAccent) {
      case 'indigo': return { primary: '#4F46E5', hover: '#4338CA', light: '#EEF2FF', lightBorder: '#E0E7FF' };
      case 'slate': return { primary: '#475569', hover: '#334155', light: '#F1F5F9', lightBorder: '#E2E8F0' };
      case 'emerald': return { primary: '#059669', hover: '#047857', light: '#ECFDF5', lightBorder: '#D1FAE5' };
      case 'blue':
      default:
        return { primary: '#2563EB', hover: '#1D4ED8', light: '#EFF6FF', lightBorder: '#DBEAFE' };
    }
  };

  const handleLogout = () => {
    logoutUser();
    localStorage.setItem('optic_is_authenticated', 'false');
    setIsAuthenticated(false);
    setIsLoggedOut(false);
  };

  const colors = getSelectedAccentColor();

  const breadcrumbs = getBreadcrumb();

  if (!isAuthenticated) {
    return (
      <LoginPage
        users={users}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
        appLogo={appLogo}
        onLoginSuccess={(email) => {
          localStorage.setItem('optic_is_authenticated', 'true');
          localStorage.setItem('optic_user_email', email);
          setIsAuthenticated(true);
          setCurrentUserEmail(email);
          setActiveTab('dashboard');
          
          // Detect and auto-open the designated agency/boutique for the logged-in user
          const savedUsers = localStorage.getItem('optic_users');
          if (savedUsers) {
            try {
              const list = JSON.parse(savedUsers);
              if (Array.isArray(list)) {
                const matched = list.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
                if (matched) {
                  const destinedAgency = (matched.allowedBoutiques && matched.allowedBoutiques.length > 0)
                    ? matched.allowedBoutiques[0]
                    : (matched.location || 'Optic Alizé - Dépôt Central');
                  localStorage.setItem('optic_active_presence_boutique', destinedAgency);
                }
              }
            } catch (err) {}
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-[#2563EB]/20 transition-all duration-150 flex bg-white text-[#0F172A]">
      {/* PWA Installation Success Banner */}
      <AnimatePresence>
        {pwaInstalledAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 font-sans"
          >
            <div className="w-8 h-8 rounded-full bg-[#0097a7]/10 flex items-center justify-center text-[#00bcd4]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">
                {currentLanguage === 'FR' ? "✓ PWA installée avec succès !" : "✓ PWA Installed successfully!"}
              </p>
              <p className="text-[10px] text-slate-450">
                {currentLanguage === 'FR' ? "L'application est disponible hors-ligne sur votre écran d'accueil." : "The application is now active offline on your home screen."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        /* Dynamic Theme Overrides for MD3 Accent Colors */
        .bg-\\[\\#2563EB\\] { background-color: ${colors.primary} !important; }
        .text-\\[\\#2563EB\\] { color: ${colors.primary} !important; }
        .border-\\[\\#2563EB\\] { border-color: ${colors.primary} !important; }
        
        /* standard blue class overrides */
        .bg-blue-600 { background-color: ${colors.primary} !important; }
        .bg-blue-700 { background-color: ${colors.hover} !important; }
        .text-blue-600 { color: ${colors.primary} !important; }
        .text-blue-700 { color: ${colors.primary} !important; }
        .text-blue-800 { color: ${colors.hover} !important; }
        .border-blue-600 { border-color: ${colors.primary} !important; }
        .bg-blue-50 { background-color: ${colors.light} !important; }
        .border-blue-100 { border-color: ${colors.lightBorder} !important; }
        .border-blue-200 { border-color: ${colors.lightBorder} !important; }
        .text-blue-900 { color: ${colors.primary} !important; }
        .ring-blue-100 { --tw-ring-color: ${colors.primary}33 !important; }
        .border-blue-500 { border-color: ${colors.primary} !important; }
        
        .hover\\:bg-\\[\\#1D4ED8\\]:hover { background-color: ${colors.hover} !important; }
        .hover\\:text-\\[\\#1D4ED8\\]:hover { color: ${colors.hover} !important; }
        .hover\\:border-\\[\\#1D4ED8\\]:hover { border-color: ${colors.hover} !important; }
        
        .hover\\:bg-blue-750:hover { background-color: ${colors.hover} !important; }
        .hover\\:bg-blue-700:hover { background-color: ${colors.hover} !important; }
        
        .bg-\\[\\#EFF6FF\\] { background-color: ${colors.light} !important; }
        .border-\\[\\#2563EB\\]\\/10 { border-color: ${colors.primary}10 !important; }
        .border-\\[\\#2563EB\\]\\/15 { border-color: ${colors.primary}15 !important; }
        .text-\\[\\#2563EB\\]\\/30 { color: ${colors.primary}4d !important; }
        .bg-\\[\\#2563EB\\]\\/10 { background-color: ${colors.primary}1a !important; }
        .bg-\\[\\#2563EB\\]\\/20 { background-color: ${colors.primary}33 !important; }
        .selection\\:bg-\\[\\#2563EB\\]\\/20::selection { background-color: ${colors.primary}33 !important; }
        
        /* Modern Tailwind CSS variables updates */
        :root {
          --color-brand-blue: ${colors.primary} !important;
          --color-brand-blue-hover: ${colors.hover} !important;
        }
      `}</style>
      
          {/* 1. FIXED LEFT SIDEBAR (Desktop only - Hidden on Tablet & Mobile) */}
          <aside className="hidden lg:flex w-64 shrink-0 flex flex-col justify-between sticky top-0 h-screen overflow-y-auto bg-white border-r border-slate-100">
            
            {/* Top Brand Logo */}
            <div>
              <div className="p-6 flex items-center gap-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] flex items-center justify-center font-display font-black text-white text-base shadow-md shrink-0 overflow-hidden">
                  {appLogo ? (
                    <img src={appLogo} alt="Logo" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                  ) : (
                    "A"
                  )}
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight font-display text-slate-900 uppercase leading-none whitespace-nowrap">
                    Optic Alizé{getUserBoutiqueSuffix()}
                  </h1>
                  <span className="text-[9px] font-bold text-[#2563EB] uppercase tracking-widest mt-1 block">
                    SaaS Platform
                  </span>
                </div>
              </div>

              {/* Sidebar Menu Groups */}
              <nav className="p-4 space-y-1">
                {[
                  { id: 'dashboard', label: currentLanguage === 'FR' ? 'Dashboard' : 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
                  { id: 'fidelisation', label: currentLanguage === 'FR' ? 'Client & Registre' : 'Client & Register', icon: <User className="w-4 h-4" /> },
                  { id: 'fidelisation_sav', label: currentLanguage === 'FR' ? 'Fidélisation & S.A.V' : 'Fidélisation & S.A.V', icon: <Award className="w-4 h-4 text-cyan-600" /> },
                  { id: 'clinique', label: currentLanguage === 'FR' ? 'Clinique & Prescription' : 'Clinical & Prescription', icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> },
                  { id: 'products', label: currentLanguage === 'FR' ? 'Catalogue Optic' : 'Optical Catalog', icon: <Package className="w-4 h-4" /> },
                  { id: 'commande', label: currentLanguage === 'FR' ? 'Commande Optic' : 'Optic Orders', icon: <ClipboardList className="w-4 h-4 text-indigo-600" /> },
                  { id: 'orders', label: currentLanguage === 'FR' ? 'Point de Vente' : 'Point of Sale (POS)', icon: <ShoppingCart className="w-4 h-4 text-blue-600" /> },
                  { id: 'journal', label: currentLanguage === 'FR' ? 'Journal de caisse' : 'Daily Cash Journal', icon: <BookOpen className="w-4 h-4 text-emerald-600" /> },
                  { id: 'websockets', label: currentLanguage === 'FR' ? 'Messagerie' : 'Messaging', icon: <MessageSquare className="w-4 h-4 text-teal-600 animate-pulse" /> },
                  { id: 'revenue', label: currentLanguage === 'FR' ? 'Comptabilité & Trésorerie' : 'Accounting & Treasury', icon: <DollarSign className="w-4 h-4" /> },
                  { id: 'reports', label: currentLanguage === 'FR' ? 'Audits & reports' : 'Audits & Reports', icon: <Compass className="w-4 h-4" /> },
                  { id: 'hr', label: currentLanguage === 'FR' ? 'Ressources Humaines' : 'Human Resources', icon: <Users className="w-4 h-4" /> },
                  { id: 'presence', label: currentLanguage === 'FR' ? 'Présence Employés' : 'Staff Attendance', icon: <UserCheck className="w-4 h-4 text-emerald-600" /> },
                  { id: 'gestion_optic', label: currentLanguage === 'FR' ? 'Gestion Optic' : 'Optic Management', icon: <Layers className="w-4 h-4 text-amber-600" /> },
                  { id: 'super_admin_monitor', label: currentLanguage === 'FR' ? 'Supervision HQ (Super Admin)' : 'Supervision HQ (Super Admin)', icon: <ShieldCheck className="w-4 h-4 text-rose-600" /> },
                  { id: 'settings', label: currentLanguage === 'FR' ? 'Paramètres' : 'Settings & Localization', icon: <Settings className="w-4 h-4" /> },
                ].filter((item) => {
                  if ((item.id === 'reports' || item.id === 'super_admin_monitor') && !isUserAdminInDirection) {
                    return false;
                  }
                  if (item.id === 'super_admin_monitor' && !isSuperAdmin) return false;
                  if (item.id === 'settings' && !isSuperAdmin) return false;
                  // Filter strictly based on user permissions
                  const userHasAccess = isSuperAdmin || userAllowedModules.includes(item.id) || item.id === 'settings';
                  // Filter based on boutique's enabled branch_modules
                  const branchHasEnabled = isModuleEnabledForCompany(item.id, currentCompany.id);
                  return userHasAccess && branchHasEnabled;
                }).map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as SaasTab)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer text-left ${
                        isActive
                          ? 'border-l-4 border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-bold'
                          : 'text-[#64748B] hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className={isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Clock removed from sidebar */}

            {/* Logout Row at the bottom */}
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 py-2 px-3 hover:bg-rose-50 text-[#64748B] hover:text-rose-600 font-semibold text-xs rounded-xl transition duration-150 text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Déconnexion (Log Out)</span>
              </button>
            </div>
          </aside>

          {/* MOBILE NAVIGATION DRAWER - Slide-over menu for Tablets and Phones */}
          <AnimatePresence>
            {isMobileSidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
                />

                {/* Left Drawer Content */}
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="relative flex flex-col justify-between w-72 max-w-[85vw] h-full bg-white shadow-2xl overflow-y-auto z-50"
                >
                  <div>
                    {/* Drawer Header */}
                    <div className="p-6 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] flex items-center justify-center font-display font-black text-white text-sm shadow-sm shrink-0 overflow-hidden">
                          {appLogo ? (
                            <img src={appLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            "A"
                          )}
                        </div>
                        <div>
                          <h1 className="text-xs font-black tracking-tight text-slate-900 uppercase leading-none whitespace-nowrap">
                            Optic Alizé{getUserBoutiqueSuffix()}
                          </h1>
                          <span className="text-[8px] font-bold text-[#2563EB] uppercase tracking-widest block mt-0.5">
                            Mobile Client
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="p-1 rounded-lg text-slate-500 hover:bg-slate-150 cursor-pointer"
                        title="Close navigation menu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="p-4 space-y-1">
                      {[
                        { id: 'dashboard', label: currentLanguage === 'FR' ? 'Dashboard' : 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
                        { id: 'fidelisation', label: currentLanguage === 'FR' ? 'Client & Registre' : 'Client & Register', icon: <User className="w-4 h-4" /> },
                        { id: 'fidelisation_sav', label: currentLanguage === 'FR' ? 'Fidélisation & S.A.V' : 'Fidélisation & S.A.V', icon: <Award className="w-4 h-4 text-cyan-600" /> },
                        { id: 'clinique', label: currentLanguage === 'FR' ? 'Clinique & Prescription' : 'Clinical & Prescription', icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> },
                        { id: 'products', label: currentLanguage === 'FR' ? 'Catalogue Optic' : 'Optical Catalog', icon: <Package className="w-4 h-4" /> },
                        { id: 'commande', label: currentLanguage === 'FR' ? 'Commande Optic' : 'Optic Orders', icon: <ClipboardList className="w-4 h-4 text-indigo-600" /> },
                        { id: 'orders', label: currentLanguage === 'FR' ? 'Point de Vente' : 'Point of Sale (POS)', icon: <ShoppingCart className="w-4 h-4 text-blue-600" /> },
                        { id: 'journal', label: currentLanguage === 'FR' ? 'Journal de caisse' : 'Daily Cash Journal', icon: <BookOpen className="w-4 h-4 text-emerald-600" /> },
                        { id: 'websockets', label: currentLanguage === 'FR' ? 'Messagerie' : 'Messaging', icon: <MessageSquare className="w-4 h-4 text-teal-600" /> },
                        { id: 'revenue', label: currentLanguage === 'FR' ? 'Comptabilité & Trésorerie' : 'Accounting & Treasury', icon: <DollarSign className="w-4 h-4" /> },
                        { id: 'reports', label: currentLanguage === 'FR' ? 'Audits & reports' : 'Audits & Reports', icon: <Compass className="w-4 h-4" /> },
                        { id: 'hr', label: currentLanguage === 'FR' ? 'Ressources Humaines' : 'Human Resources', icon: <Users className="w-4 h-4" /> },
                        { id: 'presence', label: currentLanguage === 'FR' ? 'Présence Employés' : 'Staff Attendance', icon: <UserCheck className="w-4 h-4 text-emerald-600" /> },
                        { id: 'gestion_optic', label: currentLanguage === 'FR' ? 'Gestion Optic' : 'Optic Management', icon: <Layers className="w-4 h-4 text-amber-600" /> },
                        { id: 'super_admin_monitor', label: currentLanguage === 'FR' ? 'Supervision HQ (Super Admin)' : 'Supervision HQ (Super Admin)', icon: <ShieldCheck className="w-4 h-4 text-rose-600" /> },
                        { id: 'settings', label: currentLanguage === 'FR' ? 'Paramètres' : 'Settings & Localization', icon: <Settings className="w-4 h-4" /> },
                      ].filter((item) => {
                        if ((item.id === 'reports' || item.id === 'super_admin_monitor') && !isUserAdminInDirection) {
                          return false;
                        }
                        if (item.id === 'super_admin_monitor' && !isSuperAdmin) return false;
                        if (item.id === 'settings' && !isSuperAdmin) return false;
                        const userHasAccess = isSuperAdmin || userAllowedModules.includes(item.id) || item.id === 'settings';
                        const branchHasEnabled = isModuleEnabledForCompany(item.id, currentCompany.id);
                        return userHasAccess && branchHasEnabled;
                      }).map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id as SaasTab);
                              setIsMobileSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer text-left ${
                              isActive
                                ? 'border-l-4 border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-bold'
                                : 'text-[#64748B] hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <span className={isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Drawer Footer Log out */}
                  <div className="p-4 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 py-2.5 px-3 hover:bg-rose-50 text-[#64748B] hover:text-rose-600 font-semibold text-xs rounded-xl transition duration-150 text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>{currentLanguage === 'FR' ? 'Déconnexion' : 'Log Out'}</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* 2. MAIN LAYOUT CONTAINER (With Top Navigation Bar & Action content area) */}
          <div className="flex-1 min-w-0 flex flex-col min-h-screen relative animate-fade-in bg-white">
            
            {/* TOP NAVIGATION BAR */}
            <header className="h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40 backdrop-blur-md border-b border-slate-100 bg-[#FFFFFF]/85">
              
              {/* Left Side: Hamburger & Breadcrumb navigation */}
              <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold text-[#64748B]">
                {/* Mobile hamburger button */}
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
                  aria-label="Open navigation menu"
                  title="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <span className="hidden sm:inline hover:text-[#2563EB] cursor-pointer">SaaS Alizé</span>
                <ChevronRight className="hidden sm:inline w-3.5 h-3.5" />
                <span className="hover:text-[#2563EB] cursor-pointer whitespace-nowrap">{breadcrumbs.category}</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#0F172A] font-bold whitespace-nowrap">{breadcrumbs.current}</span>
              </div>

              {/* Middle: Integrated System Clock and Calendar (moved from sidebar) */}
              <div 
                onClick={() => setIsCalendarOpen(true)}
                title={currentLanguage === 'FR' ? "Cliquer pour afficher le calendrier complet" : "Click to view full calendar"}
                className="hidden md:flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95 px-3.5 py-1.5 rounded-xl text-xs select-none cursor-pointer border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-cyan-700">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600 shrink-0 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{currentLanguage === 'FR' ? "Calendrier" : "Calendar"}</span>
                </div>
                <div className="h-3.5 w-px bg-slate-200" />
                <div className="text-slate-800 font-extrabold font-mono text-[11px] min-w-[62px] text-center">
                  {currentDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="h-3.5 w-px bg-slate-200" />
                <div className="text-[9.5px] text-slate-550 font-black capitalize">
                  {currentDateTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>

              {/* Right Side: Tool notifications, Developer toggles */}
              <div className="flex items-center gap-3 relative">
                
                {/* Offline Simulation Button */}
                <button
                  onClick={() => setIsOffline(!isOffline)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isOffline 
                      ? 'bg-amber-100 border-amber-300 text-amber-800 animate-pulse' 
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                  title={isOffline ? "Switch Online" : "Simuler Hors-Ligne"}
                >
                  <Zap className={`w-3.5 h-3.5 ${isOffline ? 'text-amber-600 fill-amber-300' : 'text-slate-500'}`} />
                  <span className="hidden xl:inline">{isOffline ? (currentLanguage === 'FR' ? "Hors-Ligne" : "Offline") : (currentLanguage === 'FR' ? "En Ligne" : "Online")}</span>
                </button>

                {/* Install App Button (PWA) */}
                {isInstallable && (
                  <button
                    onClick={handleInstallPWA}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#0097a7] text-white hover:bg-[#00bcd4] cursor-pointer shadow-sm animate-bounce transition duration-150 shrink-0"
                    title={currentLanguage === 'FR' ? "Installer l'application sur votre appareil" : "Install application on your device"}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{currentLanguage === 'FR' ? "INSTALLER" : "INSTALL"}</span>
                  </button>
                )}

                {/* Translate Toggle FR / EN */}
                <button
                  onClick={() => setCurrentLanguage(currentLanguage === 'FR' ? 'EN' : 'FR')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold border border-slate-200 bg-slate-150 text-slate-800 hover:text-black cursor-pointer shadow-sm transition"
                  title="Translate UI"
                >
                  {currentLanguage === 'FR' ? '🇫🇷 FR' : '🇬🇧 EN'}
                </button>

                {/* Dark mode selector toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-1.5 rounded-xl transition text-[#64748B] hover:text-[#0F172A] cursor-pointer bg-slate-100/50 hover:bg-slate-100"
                  title="Toggle mode"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Notifications trigger bell with floating count */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1.5 rounded-xl transition text-[#64748B] hover:text-[#0F172A] relative cursor-pointer bg-slate-100/50 hover:bg-slate-100"
                    title="Audit trail notification panel"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />
                  </button>

                  {/* Dropdown notification panel */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-80 rounded-xl p-4 shadow-xl z-50 bg-white border border-slate-100"
                      >
                        <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100">
                          <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-800">Audit Trail (Logs)</span>
                          <span className="text-[10px] text-[#2563EB] font-bold">5 en attente</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="p-1.5 rounded bg-[#DCFCE7] text-[#166534] font-semibold">
                            ✓ Vente POS #ORD-9842 enregistrée (+374.00 €)
                          </div>
                          <div className="p-1.5 rounded bg-[#DBEAFE] text-[#1E40AF]">
                            ℹ Collaborateur Antoine Sy rattaché à Paris Nation
                          </div>
                          <div className="p-1.5 rounded bg-[#FEF3C7] text-[#92400E]">
                            ⚠ Stock faible : Montures Oakley Sport (4 restante)
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Profile dropdown */}
                <div className="relative">
                  {(() => {
                    const matchedEmp = (hrEmployees || []).find((emp: any) => emp.email && emp.email.toLowerCase().trim() === currentUserEmail.toLowerCase().trim());
                    const userAvatarUrl = matchedEmp?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUserEmail)}`;
                    const userDisplayName = matchedEmp ? `${matchedEmp.firstName} ${matchedEmp.lastName}` : (currentUserEmail.includes('glabtech') ? 'Glabtech Administrator' : 'Anges Gildas Admin');
                    const userRoleName = matchedEmp?.position || (currentUserEmail.includes('glabtech') ? 'SaaS Architect' : 'Directeur Général');

                    return (
                      <>
                        <button
                          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                          className="flex items-center gap-2 cursor-pointer focus:outline-none"
                        >
                          <img 
                            src={userAvatarUrl} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-xl object-cover shadow-xs border border-slate-200" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // If image fails, replace with default initials styling inline
                              (e.target as HTMLElement).style.display = 'none';
                              const fallback = document.getElementById('avatar-fallback-initials');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div 
                            id="avatar-fallback-initials" 
                            style={{ display: 'none' }}
                            className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm"
                          >
                            {currentUserEmail.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-slate-800 hidden sm:block">
                            {userDisplayName}
                          </span>
                        </button>

                        <AnimatePresence>
                          {showProfileDropdown && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute right-0 mt-3 w-56 rounded-xl border border-slate-150 p-3 shadow-xl z-50 bg-white"
                            >
                              <div className="p-2 border-b border-slate-100 text-xs text-left">
                                <p className="font-bold text-[#0F172A]">{userDisplayName}</p>
                                <p className="text-[10px] text-[#2563EB] font-bold mt-0.5">{userRoleName}</p>
                                <p className="text-[9px] text-[#64748B] mt-0.5">Licence : SaaS Enterprise</p>
                              </div>
                              <div className="mt-1 space-y-0.5">
                                <button
                                  onClick={handleLogout}
                                  className="w-full text-left px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-bold cursor-pointer flex items-center gap-2"
                                >
                                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                                  <span>Déconnexion</span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    );
                  })()}
                </div>

              </div>
            </header>

            {/* MAIN TAB CONTENT RENDER AREA */}
            <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* SaaS native views */}
                  {activeTab === 'dashboard' && (
                    <MainDashboard 
                      darkMode={false} 
                      currentLanguage={currentLanguage} 
                      currentCompany={currentCompany} 
                      isOffline={isOffline} 
                      onNavigate={(tab) => setActiveTab(tab)}
                    />
                  )}
                  {activeTab === 'clinique' && (
                    <CliniqueModule 
                      currentLanguage={currentLanguage} 
                      currentCompany={currentCompany} 
                      isOffline={isOffline} 
                    />
                  )}
                  {activeTab === 'users' && (
                    <SaaSUsers 
                      darkMode={false}
                      currentLanguage={currentLanguage}
                      currentUserEmail={currentUserEmail}
                      users={users}
                      setUsers={setUsers}
                      hrEmployees={hrEmployees}
                    />
                  )}
                  {activeTab === 'orders' && (
                    <SaaSOrders 
                      darkMode={false}
                      currentLanguage={currentLanguage}
                      currentCompany={currentCompany}
                      isOffline={isOffline}
                    />
                  )}
                  {activeTab === 'commande' && <CommandeModule currentLanguage={currentLanguage} />}
                  {activeTab === 'journal' && <JournalModule currentLanguage={currentLanguage} />}
                  {activeTab === 'gestion_optic' && <GestionOpticModule currentLanguage={currentLanguage} />}
                  {activeTab === 'products' && <SaaSProducts darkMode={false} currentLanguage={currentLanguage} />}
                  {activeTab === 'websockets' && <WebSocketSimulator />}
                  {activeTab === 'revenue' && <AccountingModule onAddGeneratedFiles={handleAddGeneratedFiles} currentLanguage={currentLanguage} />}
                  {activeTab === 'reports' && <SaaSReports darkMode={false} currentLanguage={currentLanguage} />}
                  {activeTab === 'settings' && (
                    <SaaSSettings 
                      darkMode={false} 
                      currentUserEmail={currentUserEmail}
                      setCurrentUserEmail={setCurrentUserEmail}
                      currentLanguage={currentLanguage}
                      setCurrentLanguage={setCurrentLanguage}
                      selectedThemeAccent={selectedThemeAccent}
                      setSelectedThemeAccent={setSelectedThemeAccent}
                      companyEmail={companyEmail}
                      setCompanyEmail={setCompanyEmail}
                      companyPhone={companyPhone}
                      setCompanyPhone={setCompanyPhone}
                      appLogo={appLogo}
                      setAppLogo={setAppLogo}
                      onAddGeneratedFiles={handleAddGeneratedFiles}
                      files={files}
                      users={users}
                      setUsers={setUsers}
                    />
                  )}

                  {/* Original legacy/developer workspaces */}
                  {activeTab === 'presence' && (
                    <PresenceModule 
                      currentLanguage={currentLanguage}
                      currentCompany={currentCompany}
                      currentUserEmail={currentUserEmail}
                    />
                  )}
                  {activeTab === 'fidelisation_sav' && (
                    <FidelisationSAVModule 
                      currentLanguage={currentLanguage}
                      currentCompany={currentCompany}
                      isOffline={isOffline}
                    />
                  )}
                  {activeTab === 'fidelisation' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-[#EFF6FF] border border-[#2563EB]/15 text-[#2563EB] text-xs font-medium rounded-xl">
                        {currentLanguage === 'FR' 
                          ? "💡 Vous visualisez la vue traditionnelle des dossiers patients (Intégration Optic Alizé personnalisée)." 
                          : "💡 You are viewing the traditional customer profiles & patient folders interface (Optic Alizé integration)."}
                      </div>
                      <CRMModule currentLanguage={currentLanguage} />
                    </div>
                  )}
                  {activeTab === 'hr' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-[#EFF6FF] border border-[#2563EB]/15 text-[#2563EB] text-xs font-medium rounded-xl">
                        💡 Vous visualisez la gestion RH traditionnelle (Présences, Congés, Paies).
                      </div>
                      <HRModule 
                        onAddGeneratedFiles={handleAddGeneratedFiles} 
                        hrEmployees={hrEmployees}
                        setHrEmployees={setHrEmployees}
                        currentLanguage={currentLanguage}
                      />
                    </div>
                  )}
                  {activeTab === 'super_admin_monitor' && (
                    <SuperAdminMonitor 
                      currentLanguage={currentLanguage}
                      currentUserEmail={currentUserEmail}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

            </main>

            {/* UNIFIED DESIGN SYSTEM FOOTER */}
            <footer className="border-t border-[#E2E8F0] py-6 text-center text-[10px] font-mono text-[#64748B] mt-auto shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 px-8 max-w-7xl w-full mx-auto">
              <p>Optic Alizé Clean Architecture Suite • Conçu en standard SaaS Enterprise</p>
              <p className="flex items-center gap-1">
                <span>Made with</span>
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                <span>for {currentUserEmail}</span>
              </p>
            </footer>
          </div>

          <AnimatePresence>
            {isCalendarOpen && (
              <CalendarModal 
                isOpen={isCalendarOpen} 
                onClose={() => setIsCalendarOpen(false)} 
                currentLanguage={currentLanguage} 
              />
            )}
          </AnimatePresence>
    </div>
  );
}
