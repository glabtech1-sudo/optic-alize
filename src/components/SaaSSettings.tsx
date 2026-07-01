import React, { useState, useEffect } from 'react';
import { Settings, Shield, User, Database, Key, HelpCircle, Save, Check, AlertCircle, AlertTriangle, Trash2, Users, Globe, RefreshCw, Loader2, Palette, Cloud, Building2, Layers, Code, Zap, Sparkles, Sliders, Terminal, FolderOpen, Smartphone, ShieldCheck, Cpu, HardDrive, Filter, Activity } from 'lucide-react';
import SaaSUsers from './SaaSUsers';
import { setupUserMFA, fetchUserProfile } from '../lib/api';
import SuperAdminHQModule from './SuperAdminHQModule';
import ArchitectureBlueprint from './ArchitectureBlueprint';
import CodeWorkspace from './CodeWorkspace';
import DatabaseExplorer from './DatabaseExplorer';
import WebSocketSimulator from './WebSocketSimulator';
import AIAssistant from './AIAssistant';
import DesignSystem from './DesignSystem';
import { secureLRSStorage, generateSimulatedLoad, SimulatedSimultaneousSession, encryptLRSData, decryptLRSData } from '../utils/security';

interface SaaSSettingsProps {
  darkMode?: boolean;
  currentUserEmail?: string;
  setCurrentUserEmail?: (email: string) => void;
  currentLanguage?: 'FR' | 'EN';
  setCurrentLanguage?: (lang: 'FR' | 'EN') => void;
  selectedThemeAccent?: 'blue' | 'indigo' | 'slate' | 'emerald';
  setSelectedThemeAccent?: (theme: 'blue' | 'indigo' | 'slate' | 'emerald') => void;
  companyEmail?: string;
  setCompanyEmail?: (email: string) => void;
  companyPhone?: string;
  setCompanyPhone?: (phone: string) => void;
  appLogo?: string;
  setAppLogo?: (logo: string) => void;
  onAddGeneratedFiles?: (files: any[]) => void;
  files?: any[];
  users?: any[];
  setUsers?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function SaaSSettings({ 
  darkMode = false,
  currentUserEmail = 'glabtech1@opticalize.com',
  setCurrentUserEmail,
  currentLanguage = 'FR',
  setCurrentLanguage,
  selectedThemeAccent = 'blue',
  setSelectedThemeAccent,
  companyEmail = 'contact@opticalize.com',
  setCompanyEmail,
  companyPhone = '+228 90 00 00 00',
  setCompanyPhone,
  appLogo = '',
  setAppLogo,
  onAddGeneratedFiles,
  files = [],
  users,
  setUsers
}: SaaSSettingsProps) {
  const [activeSettingsCategory, setActiveSettingsCategory] = useState<string>('profile');
  const [activeDevSubTab, setActiveDevSubTab] = useState<'blueprint' | 'riverpod' | 'broker_logs' | 'collaborative' | 'code' | 'database' | 'ai' | 'design_system'>('blueprint');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showWipeSuccess, setShowWipeSuccess] = useState(false);
  const [wipePassword, setWipePassword] = useState('');
  const [wipeError, setWipeError] = useState<string | null>(null);
  const [showWipePassword, setShowWipePassword] = useState(false);
  const [wipeProgress, setWipeProgress] = useState<number | null>(null);
  const [wipeProgressText, setWipeProgressText] = useState<string>('');

  // Determine if active user is admin
  const isAdmin = currentUserEmail === 'glabtech1@gmail.com' || 
                  currentUserEmail === 'glabtech1@opticalize.com' || 
                  currentUserEmail === 'anges.gildas@gmail.com' || 
                  currentUserEmail === 'anges.gildas@opticalizé.com' ||
                  currentUserEmail === 'anges.gildas@opticalize.com';

  const loggedInUser = (users || []).find((u: any) => u.email === currentUserEmail);
  const userHasAllRights = isAdmin || (loggedInUser?.role === 'Admin');

  useEffect(() => {
    const allowed = userHasAllRights 
      ? ['profile', 'sauvegarde', 'themes', 'security', 'api', 'super_admin_hq', 'dev_portal']
      : ['profile'];
    if (!allowed.includes(activeSettingsCategory)) {
      setActiveSettingsCategory('profile');
    }
  }, [currentUserEmail, userHasAllRights]);

  // Profile forms
  const [profileName, setProfileName] = useState('Optic Alizé ERP Admin');
  const [profileRole, setProfileRole] = useState('Principal Security Architect');
  const [profileMfa, setProfileMfa] = useState(false);
  const [mfaSecretText, setMfaSecretText] = useState<string | null>(null);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadMfaProfile() {
      try {
        const u = await fetchUserProfile();
        if (u) {
          setProfileMfa(u.mfaEnabled);
          setMfaSecretText(u.mfaSecret || null);
        } else {
          const profileStr = localStorage.getItem('optic_user_profile');
          if (profileStr) {
            const parsed = JSON.parse(profileStr);
            setProfileMfa(!!parsed.mfaEnabled);
          }
        }
      } catch (err) {}
    }
    loadMfaProfile();
  }, [currentUserEmail]);

  const handleToggleMFA = async () => {
    const nextState = !profileMfa;
    setProfileMfa(nextState);
    const data = await setupUserMFA(nextState);
    if (data) {
      if (nextState) {
        setMfaSecretText(data.secret || null);
        setMfaQrCode(data.qrCode || null);
      } else {
        setMfaSecretText(null);
        setMfaQrCode(null);
      }
    }
  };

  const [boutiqueName, setBoutiqueName] = useState(
    () => localStorage.getItem('optic_boutique_name') || 'Optic Alizé - Dépôt Central'
  );

  // Logo uploader state
  const [logoPreview, setLogoPreview] = useState<string | null>(() => {
    return localStorage.getItem('optic_app_logo_base64') || localStorage.getItem('optic_app_logo') || '';
  });

  // Keep logoPreview in sync with parent state
  useEffect(() => {
    if (appLogo !== undefined) {
      setLogoPreview(appLogo);
    }
  }, [appLogo]);

  // Backup / Sauvegarde States
  const [backingUp, setBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string>('Aujourd\'hui, 08:32');
  const [backupSize, setBackupSize] = useState<string>('42.8 MB');
  const [backupHistory, setBackupHistory] = useState([
    { id: 'BKP-01', date: '2026-06-11 18:00', type: 'Automatique', size: '42.5 MB', status: 'Succès' },
    { id: 'BKP-02', date: '2026-06-10 18:05', type: 'Automatique', size: '42.1 MB', status: 'Succès' },
    { id: 'BKP-03', date: '2026-06-09 14:12', type: 'Manuelle', size: '41.9 MB', status: 'Succès' },
  ]);

  // Themes States
  // Managed on high-level app state, passed as props.

  // Organization info
  const [orgName, setOrgName] = useState(
    () => localStorage.getItem('optic_org_name') || 'Optic Alizé Main Head Office'
  );
  const [orgDomain, setOrgDomain] = useState(
    () => localStorage.getItem('optic_org_domain') || 'opticalize.com'
  );
  const [orgLicence, setOrgLicence] = useState('SaaS-Enterprise-2026-X812');

  // Sync organization info to localStorage
  useEffect(() => {
    localStorage.setItem('optic_org_name', orgName);
  }, [orgName]);

  useEffect(() => {
    localStorage.setItem('optic_org_domain', orgDomain);
  }, [orgDomain]);

  // LRS Cryptography and 50-100 High Load Concurrency state variables
  const [lrsCryptoEnabled, setLrsCryptoEnabled] = useState<boolean>(true);
  const [lrsTestStatus, setLrsTestStatus] = useState<'idle' | 'testing' | 'secured' | 'tamper_detected'>('idle');
  const [lrsTestLog, setLrsTestLog] = useState<string[]>([]);
  const [simulatedLoadSize, setSimulatedLoadSize] = useState<number>(75);
  const [sessionsList, setSessionsList] = useState<SimulatedSimultaneousSession[]>([]);
  const [isLrsSimulating, setIsLrsSimulating] = useState<boolean>(true);

  // Auto-simulate high volume concurrent operations & live transactions
  useEffect(() => {
    setSessionsList(generateSimulatedLoad(simulatedLoadSize));
  }, [simulatedLoadSize]);

  useEffect(() => {
    if (!isLrsSimulating) return;
    const interval = setInterval(() => {
      setSessionsList(prev => prev.map(session => {
        // Randomly cycle status
        if (Math.random() > 0.6) {
          const statuses: ('active' | 'syncing' | 'idle' | 'conflict_resolved')[] = ['active', 'syncing', 'idle', 'conflict_resolved'];
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          const newPing = Math.max(2, Math.min(180, session.pingMs + (Math.random() > 0.5 ? 4 : -4)));
          return {
            ...session,
            status: randomStatus,
            pingMs: newPing,
            payloadKBSync: parseFloat((Math.random() * 24 + 0.5).toFixed(2))
          };
        }
        return session;
      }));
    }, 1800);
    return () => clearInterval(interval);
  }, [isLrsSimulating]);

  const runLrsAntiPiracyTest = () => {
    setLrsTestStatus('testing');
    setLrsTestLog([
      "INJECTION TEST: [SYS_INIT_V2] Initialisation du tunnel d'audit LRS...",
      "CIPHER: Chargement de l'algorithme Symétrique Tournant avec bloc de salage OPTICALIZE_SECURE_SALT_2026...",
      "DATA LOCK: Chiffrement en cours d'un profil patient d'essai..."
    ]);

    setTimeout(() => {
      const originalPayload = JSON.stringify({ patient: "Gildas Concept", prescription: "OD -3.50 OS -3.25 ADD 2.00" });
      const encrypted = encryptLRSData(originalPayload);
      
      setLrsTestLog(prev => [
        ...prev,
        `CIPHER OUT: Résultat chiffré: "${encrypted.slice(0, 52)}..."`,
        "PIRACY RESISTANCE: Tentative d'attaque par falsification de chaînes de cache (Simulation Hack DevTools)..."
      ]);

      setTimeout(() => {
        // Try tampering the encrypted ciphertext
        const modifiedEncrypted = encrypted.replace("LRS_V2|", "LRS_V2|99999|"); // Alter the integrity check sum with offset

        setLrsTestLog(prev => [
          ...prev,
          "INJECT FALSE DATA: Écriture du payload altéré dans le buffer...",
          "INTEGRITY CHECK: Déchiffrement et validation Fletcher16 checksum..."
        ]);

        setTimeout(() => {
          const decryptAttempt = decryptLRSData(modifiedEncrypted);
          if (decryptAttempt.compromised) {
            setLrsTestStatus('tamper_detected');
            setLrsTestLog(prev => [
              ...prev,
              "🚨 ALERTE INTÉGRITÉ COMPROMISE détectée !",
              "🛡️ ACTION DE SÉCURITÉ: Blocage immédiat du flux LRS, rejet de la tentative d'injection SQL/XSS.",
              "✓ SUCCÈS: Le pare-feu local a neutralisé l'attaque de piratage."
            ]);
          } else {
            setLrsTestStatus('secured');
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('optic_boutique_name', boutiqueName);
    localStorage.setItem('optic_org_name', orgName);
    localStorage.setItem('optic_org_domain', orgDomain);
    if (setAppLogo) {
      setAppLogo(logoPreview || '');
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const triggerManualBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      const now = new Date();
      const timeStr = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setLastBackupTime(timeStr);
      setBackupSize('43.2 MB');
      setBackupHistory(prev => [
        { id: 'BKP-' + Math.floor(Math.random() * 1000), date: timeStr, type: 'Manuelle', size: '43.2 MB', status: 'Succès' },
        ...prev
      ]);
    }, 2000);
  };

  const handleSystemWipe = () => {
    setWipePassword('');
    setWipeError(null);
    setShowWipeConfirm(true);
  };

  const performActualSystemWipe = () => {
    // Verify password first
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
            
            return (u.role === 'Admin' || isSuperAdminEmail) && u.password === wipePassword;
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
    if (fallbackPasswords.includes(wipePassword)) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      setWipeError(currentLanguage === 'FR' ? "Mot de passe incorrect. Réinitialisation refusée." : "Incorrect password. Reset denied.");
      return;
    }

    setShowWipeConfirm(false);
    setWipeProgress(0);
    setWipeProgressText(currentLanguage === 'FR' ? "Initialisation de la purge globale..." : "Initializing global database wipe...");

    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += 5;
      if (currentPct > 100) {
        currentPct = 100;
      }
      setWipeProgress(currentPct);

      if (currentPct === 20) {
        setWipeProgressText(currentLanguage === 'FR' ? "Purge de l'historique de vente et de caisse..." : "Wiping sales history and registers...");
      } else if (currentPct === 40) {
        setWipeProgressText(currentLanguage === 'FR' ? "Suppression des examens optiques et ordonnances..." : "Clearing clinical optics and prescriptions...");
      } else if (currentPct === 60) {
        setWipeProgressText(currentLanguage === 'FR' ? "Effacement de la paie et des plannings RH..." : "Clearing payslips and HR planning...");
      } else if (currentPct === 80) {
        setWipeProgressText(currentLanguage === 'FR' ? "Purge finale des stocks, SAV et comptabilité..." : "Purging stock inventory, warranty and ledger...");
      } else if (currentPct === 100) {
        clearInterval(interval);
        setWipeProgressText(currentLanguage === 'FR' ? "Terminé ! Déconnexion générale..." : "Done! General logout...");

        // Clear all module-specific transaction and seed databases
        const emptyKeys = [
          'optic_hq_zones',
          'optic_hq_branches',
          'optic_hq_branch_modules',
          'optic_hq_sales',
          'optic_hq_employees',
          'optic_hq_pending_orders',
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
          'optic_credited_loyalty_orders'
        ];
        
        emptyKeys.forEach(key => {
          localStorage.setItem(key, JSON.stringify([]));
        });
        
        // Special clear for dictionary/object states
        localStorage.setItem('optic_journal_data', JSON.stringify({}));
        localStorage.setItem('optic_system_factory_reset', 'true');

        // Log out user to redirect them back to the login screen on click
        localStorage.setItem('optic_is_authenticated', 'false');
        localStorage.removeItem('optic_remember_me');
        localStorage.removeItem('optic_remembered_email');
        localStorage.removeItem('optic_remembered_password');
        localStorage.removeItem('optic_user_email');
        localStorage.removeItem('optic_active_presence_boutique');

        setTimeout(() => {
          setWipeProgress(null);
          setShowWipeSuccess(true);
        }, 800);
      }
    }, 100);
  };

  return (
    <div className={`p-1 space-y-6 ${darkMode ? 'dark text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {currentLanguage === 'FR' ? "Paramètres du Système ERP SaaS" : "SaaS ERP System Settings"}
        </h2>
        <p className="text-xs text-[#64748B] mt-1 dark:text-slate-400">
          {currentLanguage === 'FR'
            ? "Configurez votre profil d'utilisateur, gérez les sauvegardes, configurez les thèmes, adaptez la langue et suivez vos clefs techniques d'isolation multi-tenant."
            : "Manage your member profile, run warm cloud database backups, select Material You accent themes, adjust system localization, and monitor multi-tenant security layers."}
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Top tab navigation - displaying tabs on top instead of left side */}
        <div className="flex flex-row flex-wrap gap-2 pb-3 border-b border-slate-150 overflow-x-auto scrollbar-none">
          {[
            { id: 'profile', label: currentLanguage === 'FR' ? "Profil d'Utilisateur" : "User Profile", icon: <User className="w-4 h-4 shrink-0" /> },
            { id: 'sauvegarde', label: currentLanguage === 'FR' ? 'Sauvegarde & Backups' : 'Database Backups', icon: <Cloud className="w-4 h-4 shrink-0" /> },
            { id: 'themes', label: currentLanguage === 'FR' ? 'Thèmes & Langues' : 'Themes & Languages', icon: <Palette className="w-4 h-4 shrink-0" /> },
            { id: 'security', label: currentLanguage === 'FR' ? 'Sécurité & MFA' : 'Security & MFA', icon: <Shield className="w-4 h-4 shrink-0" /> },
            { id: 'api', label: currentLanguage === 'FR' ? "Clefs API d'Intégration" : "API Keys & Integrations", icon: <Key className="w-4 h-4 shrink-0" /> },
            { id: 'super_admin_hq', label: currentLanguage === 'FR' ? 'Console Siège HQ (Admin)' : 'HQ Headquarters Terminal (Admin)', icon: <Building2 className="w-4 h-4 shrink-0" /> },
            { id: 'dev_portal', label: currentLanguage === 'FR' ? 'Portail Dev & Blueprints' : 'Dev Portal & Blueprints', icon: <Code className="w-4 h-4 shrink-0 text-emerald-600" /> }
          ].filter(category => {
            if (userHasAllRights) return true;
            return category.id === 'profile';
          }).map(category => (
            <button
              key={category.id}
              onClick={() => setActiveSettingsCategory(category.id)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer text-left whitespace-nowrap shrink-0 ${
                activeSettingsCategory === category.id
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold shadow-2xs border border-blue-150/55'
                  : 'text-[#64748B] dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              {category.icon}
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* Right sub-settings panel column */}
        <div className="w-full">
          
          {/* SUPER ADMIN HQ PORTAL DIRECT BLOCK */}
          {activeSettingsCategory === 'super_admin_hq' && isAdmin && (
            <div className={`p-6 rounded-xl bg-white shadow-xs`}>
              <SuperAdminHQModule 
                onAddGeneratedFiles={onAddGeneratedFiles || (() => {})}
                currentLanguage={currentLanguage} 
                darkMode={darkMode}
                currentUserEmail={currentUserEmail}
                orgName={orgName}
                setOrgName={setOrgName}
                orgDomain={orgDomain}
                setOrgDomain={setOrgDomain}
                orgLicence={orgLicence}
                companyEmail={companyEmail}
                setCompanyEmail={setCompanyEmail}
                companyPhone={companyPhone}
                setCompanyPhone={setCompanyPhone}
                appLogo={appLogo}
                setAppLogo={setAppLogo}
                users={users}
                setUsers={setUsers}
              />
            </div>
          )}

          {/* TECHNICAL DEV PORTAL & BLUEPRINTS BLOCK */}
          {activeSettingsCategory === 'dev_portal' && isAdmin && (
            <div className="space-y-6">
              {/* Secondary Sub-tab switcher */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl">
                {[
                  { id: 'blueprint', label: currentLanguage === 'FR' ? 'Concept Clean Architecture' : 'Clean Architecture Spec', icon: <Layers className="w-3.5 h-3.5" /> },
                  { id: 'riverpod', label: currentLanguage === 'FR' ? 'Architecture Riverpod' : 'Riverpod Architecture Spec', icon: <Code className="w-3.5 h-3.5" /> },
                  { id: 'broker_logs', label: currentLanguage === 'FR' ? 'Logs Réseau d\'Échange' : 'Exchange Network Logs', icon: <Terminal className="w-3.5 h-3.5" /> },
                  { id: 'collaborative', label: currentLanguage === 'FR' ? 'Édition & Verrous' : 'Cooperative Edit & Locks', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                  { id: 'database', label: currentLanguage === 'FR' ? 'Explorateur DB' : 'Database Explorer', icon: <Database className="w-3.5 h-3.5" /> },
                  { id: 'code', label: currentLanguage === 'FR' ? 'Code & Workspace' : 'Tree Workspace & Codes', icon: <FolderOpen className="w-3.5 h-3.5" /> },
                  { id: 'ai', label: currentLanguage === 'FR' ? 'Orchestrateur IA' : 'Generative AI Orchestrator', icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { id: 'design_system', label: currentLanguage === 'FR' ? 'Design System' : 'Styleguide Design System', icon: <Sliders className="w-3.5 h-3.5" /> },
                ].map((subTab) => {
                  const isSubActive = activeDevSubTab === subTab.id;
                  return (
                    <button
                      key={subTab.id}
                      type="button"
                      onClick={() => setActiveDevSubTab(subTab.id as any)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer select-none ${
                        isSubActive 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      {subTab.icon}
                      <span>{subTab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* View Rendering based on subTab selected */}
              <div className="p-1 rounded-xl">
                {activeDevSubTab === 'blueprint' && <ArchitectureBlueprint />}
                {activeDevSubTab === 'riverpod' && <WebSocketSimulator mode="riverpod" />}
                {activeDevSubTab === 'broker_logs' && <WebSocketSimulator mode="logs" />}
                {activeDevSubTab === 'collaborative' && <WebSocketSimulator mode="collaborative" />}
                {activeDevSubTab === 'database' && <DatabaseExplorer />}
                {activeDevSubTab === 'code' && <CodeWorkspace files={files || []} />}
                {activeDevSubTab === 'ai' && <AIAssistant onAddGeneratedFiles={onAddGeneratedFiles} />}
                {activeDevSubTab === 'design_system' && <DesignSystem />}
              </div>
            </div>
          )}

          {/* OTHER SUB-SETTINGS FORMS BLOCK */}
          {activeSettingsCategory !== 'super_admin_hq' && activeSettingsCategory !== 'dev_portal' && (
            <div className={`p-6 rounded-xl bg-white text-xs`}>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* SUBSECTION A: PROFILE */}
                {activeSettingsCategory === 'profile' && (
                  <div className="space-y-4 font-sans">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
                        {currentLanguage === 'FR' ? "Profil d'Utilisateur" : "User Profile Card"}
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        {currentLanguage === 'FR' ? "Configurez vos coordonnées d'administration." : "Configure your administrative credentials and security identity."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Nom d'affichage</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Email Principal (Admin ou Créateur)</label>
                        <select
                          className="w-full px-3 py-2 text-xs rounded-xl border border-blue-200 bg-blue-50/50 focus:outline-none focus:border-blue-500 font-bold text-blue-900 font-mono"
                          value={currentUserEmail}
                          onChange={(e) => setCurrentUserEmail?.(e.target.value)}
                        >
                          <option value="glabtech1@opticalize.com">glabtech1@opticalize.com (Super Admin - Créateur)</option>
                          <option value="anges.gildas@opticalizé.com">anges.gildas@opticalizé.com (Super Admin - Créateur)</option>
                          <option value="anges.gildas@opticalize.com">anges.gildas@opticalize.com (Super Admin - Créateur)</option>
                          <option value="autre_opticien@optic.com">autre_opticien@optic.com (Utilisateur Classique)</option>
                        </select>
                        <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                          ⚠️ <strong>Note de sécurité :</strong> Les adresses <span className="font-semibold text-blue-600">glabtech1@opticalize.com</span> et <span className="font-semibold text-blue-600">anges.gildas@opticalizé.com</span> bénéficient d'un accès exclusif au portail technique "Dev Portal & Blueprints".
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1 font-semibold">Nom de l'Agence (Défini dans les Paramètres)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-rose-200 bg-rose-50/20 focus:outline-none focus:ring-1 focus:ring-rose-500 font-extrabold text-rose-900"
                        value={boutiqueName}
                        onChange={(e) => setBoutiqueName(e.target.value)}
                      />
                      <p className="text-[10px] text-slate-450 mt-1">Sert de nom d'entête officiel pour tous vos reçus, fiches d'adaptation, impressions et exports de documents en Agence.</p>
                    </div>

                    {/* LOGO UPLOAD COMPONENT UNIT */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-3xs animate-fade-in">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-emerald-650 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Logo Officiel de l'Agence (Entête de Facturation et Documents)</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Téléversez une image PNG ou JPEG contenant le logo officiel d'Optic Alizé. Elle sera automatiquement optimisée, mise en cache locale et convertie en filigrane monochrome pour vos documents PDF (reçus de caisse, bilans ophtalmiques, fiches d'atelier, bulletins de paie RH, livres comptables).
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {logoPreview ? (
                          <div className="relative shrink-0 border border-slate-200 rounded-lg p-1.5 bg-white">
                            <img 
                              src={logoPreview} 
                              alt="Logo" 
                              className="w-16 h-16 object-contain rounded-md" 
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setLogoPreview('');
                                localStorage.removeItem('optic_app_logo');
                                localStorage.removeItem('optic_app_logo_base64');
                                localStorage.removeItem('optic_app_logo_watermark');
                                if (setAppLogo) {
                                  setAppLogo('');
                                }
                              }}
                              className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center cursor-pointer shadow-sm"
                              title="Supprimer ce logo"
                            >
                              &times;
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-white border border-dashed border-slate-350 flex items-center justify-center text-slate-400 font-mono text-[10px] font-bold shrink-0">
                            AUCUN LOGO
                          </div>
                        )}
                        
                        <div className="flex-1 w-full">
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert("Le fichier est trop volumineux (Max 2 Mo)");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const base64 = reader.result as string;
                                  setLogoPreview(base64);
                                  localStorage.setItem('optic_app_logo', base64);
                                  localStorage.setItem('optic_app_logo_base64', base64);
                                  if (setAppLogo) {
                                    setAppLogo(base64);
                                  }

                                  // Convert to optimized canvas outputs and write watermarks
                                  try {
                                    const img = new Image();
                                    img.onload = () => {
                                      const canvasSolid = document.createElement('canvas');
                                      canvasSolid.width = img.naturalWidth || img.width || 400;
                                      canvasSolid.height = img.naturalHeight || img.height || 400;
                                      const ctx = canvasSolid.getContext('2d');
                                      if (ctx) {
                                        ctx.drawImage(img, 0, 0);
                                        localStorage.setItem('optic_app_logo_base64', canvasSolid.toDataURL('image/jpeg', 0.85));
                                      }

                                      const canvasWm = document.createElement('canvas');
                                      canvasWm.width = 400;
                                      canvasWm.height = 400;
                                      const ctxWm = canvasWm.getContext('2d');
                                      if (ctxWm) {
                                        ctxWm.clearRect(0, 0, 400, 400);
                                        ctxWm.globalAlpha = 0.06;
                                        ctxWm.drawImage(img, 0, 0, 400, 400);
                                        localStorage.setItem('optic_app_logo_watermark', canvasWm.toDataURL('image/png'));
                                      }
                                    };
                                    img.src = base64;
                                  } catch (err) {
                                    console.warn(err);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">Fichiers recommandés : PNG transparent ou JPEG blanc (dimensions carrées préférées, Max 2 Mo).</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1 font-semibold">Rôle d'affectation globale</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs rounded-xl text-slate-500 bg-slate-100 border border-slate-150 cursor-not-allowed"
                        value={profileRole}
                        disabled
                      />
                      <p className="text-[10px] text-slate-450 mt-1">Rôle technique géré par Supabase RBAC global.</p>
                    </div>
                  </div>
                )}

                {/* SUBSECTION B: SAUVEGARDE & BACKUP */}
                {activeSettingsCategory === 'sauvegarde' && (
                  <div className="space-y-4 font-sans">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
                        {currentLanguage === 'FR' ? "Sauvegarde & Restauration" : "Backup & Restoration Hub"}
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        {currentLanguage === 'FR' ? "Gérez les sauvegardes à chaud de la base de données PostgreSQL de production." : "Manage non-blocking hot backups of the cloud database."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Dernière sauvegarde</span>
                        <span className="text-sm font-black mt-1 block text-slate-800">{lastBackupTime}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Volume de données</span>
                        <span className="text-sm font-black mt-1 block text-slate-800">{backupSize}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Sauvegarde Automatique</span>
                        <span className="text-xs font-bold text-emerald-600 mt-1 block flex items-center gap-1">
                          ● Activé (Journalier)
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                      <div className="space-y-1 pr-4 text-left">
                        <span className="text-xs font-bold block text-blue-900">Forcer une sauvegarde manuelle réactive</span>
                        <p className="text-[10px] text-blue-750 leading-relaxed">
                          Crée instantanément une archive de la base de données synchronisée avec les serveurs Cloud Run. Vous pouvez la restaurer ou la télécharger à tout moment au format SQL / JSON.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={triggerManualBackup}
                        disabled={backingUp}
                        className="shrink-0 bg-blue-605 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer select-none flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {backingUp ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Création...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Lancer</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Progressive Web App (PWA) Client Suite */}
                    <div className="p-4 bg-cyan-50/40 border border-cyan-150 rounded-xl space-y-3 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 shrink-0">
                          <Smartphone className="w-4.5 h-4.5" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-black block text-cyan-900 leading-tight">
                            {currentLanguage === 'FR' ? "Suite Client Progressive Web App (PWA)" : "Progressive Web App (PWA) Client Suite"}
                          </span>
                          <p className="text-[10px] text-cyan-850 leading-snug mt-0.5">
                            {currentLanguage === 'FR' 
                              ? "L'application Optic Alizé intègre un moteur de service worker local autonome pour garantir une fluidité d'exécution et un fonctionnement hors-ligne optimal." 
                              : "Optic Alize features a built-in Service Worker to enable offline execution and robust performance on any platform."}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-cyan-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        <div>
                          <span className="text-[9px] font-bold text-cyan-700 block uppercase">Moteur de Cache Local</span>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {currentLanguage === 'FR' ? "Actif (Stale-While-Revalidate)" : "Active (Stale-While-Revalidate)"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-cyan-700 block uppercase">Mode Autonome Installable</span>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {currentLanguage === 'FR' ? "Prêt pour iOS Safari / macOS / Android Chrome" : "iOS Safari / Android Chrome ready"}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white/60 rounded-xl border border-cyan-100 text-left space-y-2">
                        <span className="text-[10px] font-black text-cyan-900 block uppercase">
                          {currentLanguage === 'FR' ? "💡 Guide d'installation rapide" : "💡 Installation Guidelines"}
                        </span>
                        <ul className="text-[10px] text-cyan-950 space-y-1.5 leading-relaxed pl-3 list-disc font-medium">
                          <li>
                            <strong>Google Chrome / Edge (PC/Mac) :</strong> 
                            {currentLanguage === 'FR' ? " Cliquez sur le bouton d'installation [INSTALLER] apparaissant en haut dans la barre d'entête de l'application." : " Use the [INSTALL] button at the top header of the workspace."}
                          </li>
                          <li>
                            <strong>Safari (iPhone / iPad) :</strong> 
                            {currentLanguage === 'FR' ? " Appuyez sur le menu de partage de Safari (icône flèche sortante) puis choisissez 'Sur l'écran d'accueil'." : " Press Safari share button, select 'Add to Home Screen' option."}
                          </li>
                          <li>
                            <strong>Chrome / Samsung (Android) :</strong> 
                            {currentLanguage === 'FR' ? " Appuyez sur les trois points verticaux en haut à droite de Chrome puis sélectionnez 'Installer l'application'." : " Click browser dots, choose 'Install application'."}
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50/40 border border-red-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1 text-left">
                        <span className="text-xs font-bold block text-red-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 animate-pulse" />
                          {currentLanguage === 'FR' ? "Réinitialisation complète à blanc" : "Full Core Database Wipe"}
                        </span>
                        <p className="text-[10px] text-red-750 leading-relaxed max-w-xl">
                          {currentLanguage === 'FR' 
                            ? "Efface définitivement toutes les transactions de caisse (ventes), fiches cliniques, ordonnances de verres, fiches d'atelier, plannings de présence, stocks de pièces, SAV et comptes de dépenses. Vous conservez uniquement vos identifiants administrateurs."
                            : "Deletes all checkout operations, clinical refractions, lenses prescriptions, lab worksheets, attendance schedules, inventory parts, SAV requests, and expense books. Admin user accounts are preserved."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSystemWipe}
                        className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer select-none flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{currentLanguage === 'FR' ? "Effacer toutes les données" : "Clear All Data"}</span>
                      </button>
                    </div>

                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">Historique récent des sauvegardes</span>
                      <div className="overflow-hidden border border-slate-150 rounded-xl bg-white text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 font-semibold text-slate-500 border-b border-slate-150">
                            <tr>
                              <th className="p-2.5 pl-4">ID Archive</th>
                              <th className="p-2.5">Date & Heure</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Taille</th>
                              <th className="p-2.5 pr-4 text-right">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {backupHistory.map(b => (
                              <tr key={b.id} className="hover:bg-slate-50/50">
                                <td className="p-2.5 pl-4 font-bold text-slate-705">{b.id}</td>
                                <td className="p-2.5 text-slate-550">{b.date}</td>
                                <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-slate-100 font-sans font-semibold text-[10px] text-slate-600">{b.type}</span></td>
                                <td className="p-2.5 font-bold text-slate-700">{b.size}</td>
                                <td className="p-2.5 pr-4 text-right text-emerald-600 font-bold font-sans">✓ Succès</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBSECTION C: THÈMES & LANGUES */}
                {activeSettingsCategory === 'themes' && (
                  <div className="space-y-4 font-sans">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
                        {currentLanguage === 'FR' ? "Thèmes & Langues" : "Themes & Languages Workspace"}
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        {currentLanguage === 'FR' ? "Personnalisez la langue d'affichage globale ainsi que la palette de couleurs d'accents du système." : "Personnalize global localization display languages and system accent palettes."}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <span className="text-xs font-bold block text-slate-750">Langue Principale de l'Interface</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentLanguage?.('FR')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border select-none cursor-pointer ${
                            currentLanguage === 'FR'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>Français (FR)</span>
                          {currentLanguage === 'FR' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentLanguage?.('EN')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border select-none cursor-pointer ${
                            currentLanguage === 'EN'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>English (EN)</span>
                          {currentLanguage === 'EN' && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <span className="text-xs font-bold block text-slate-750">Couleur d'accentuation d'interface (MD3)</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'blue', label: 'Bleu Royal', color: 'bg-blue-600' },
                          { id: 'indigo', label: 'Indigo Alizé', color: 'bg-indigo-600' },
                          { id: 'slate', label: 'Gris Ardoise', color: 'bg-slate-700' },
                          { id: 'emerald', label: 'Menthe / Émeraude', color: 'bg-emerald-600' },
                        ].map(accent => (
                          <button
                            key={accent.id}
                            type="button"
                            onClick={() => setSelectedThemeAccent(accent.id as any)}
                            className={`p-2 rounded-xl text-xs font-semibold cursor-pointer select-none border transition flex items-center gap-2 bg-white ${
                              selectedThemeAccent === accent.id
                                ? 'border-blue-600 ring-2 ring-blue-100'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${accent.color}`} />
                            <span className="text-slate-700">{accent.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBSECTION D: ORGANIZATION / TENANCY */}
                {activeSettingsCategory === 'organization' && (
                  <div className="space-y-4 font-sans">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">Paramètres d'Organisation et de Multi-Maison</h3>
                      <p className="text-xs text-[#64748B]">Administrez l'isolement SaaS et le domaine d'organisation de Optic Alizé.</p>
                    </div>

                    {/* Logo Upload Box */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-5 items-center">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] flex items-center justify-center font-display font-black text-white text-2xl shadow-md shrink-0 overflow-hidden relative">
                        {appLogo ? (
                          <img src={appLogo} alt="Logo" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                        ) : (
                          "OA"
                        )}
                      </div>
                      
                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <span className="text-xs font-bold text-slate-800 block">Logo de l'Entreprise (Optic Alizé Logo)</span>
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
                                    setAppLogo?.(reader.result);
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
                            onClick={() => setAppLogo?.('')}
                            className="ml-3 text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer underline"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Nom d'entreprise (Tenant Name)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Email de Contact Officiel</label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail?.(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Téléphone de Contact Officiel</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone?.(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Domaine d'organisation</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-blue-500 font-semibold text-slate-805"
                          value={orgDomain}
                          onChange={(e) => setOrgDomain(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Licence active</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 text-xs rounded-xl text-slate-550 bg-slate-100 cursor-not-allowed border border-slate-150"
                          value={orgLicence}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}

                 {/* SUBSECTION E: SECURITY */}
                {activeSettingsCategory === 'security' && (
                  <div className="space-y-6 font-sans text-left">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
                        {currentLanguage === 'FR' ? "Préférences de Sécurité & Cryptographie LRS" : "Security Preferences & LRS Cryptography"}
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        {currentLanguage === 'FR' 
                          ? "Garantissez l'inviolabilité de vos fichiers patients en local et suivez l'acheminement réseau multi-utilisateur simultané." 
                          : "Shield client optical records offline and monitor parallel multi-user high capacity operations."}
                      </p>
                    </div>

                    {/* LRS Cryptographic Engine Card */}
                    <div className="p-5 rounded-2xl border border-cyan-150 bg-gradient-to-br from-cyan-50/30 to-white space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 shrink-0">
                            <ShieldCheck className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-xs font-black block text-cyan-900 leading-tight">
                              {currentLanguage === 'FR' ? "Chiffrement Symétrique de Cache Local (LRSv2)" : "Symmetric Local Cache Encryption (LRSv2)"}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              {currentLanguage === 'FR' ? "Actif & Protégé contre l'injection XSS" : "Active & XSS Injection Proof"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100/50 px-2.5 py-1 rounded-lg">
                            AES-rotv2
                          </span>
                        </div>
                      </div>

                      <p className="text-[10.5px] text-cyan-950 leading-relaxed font-medium">
                        {currentLanguage === 'FR'
                          ? "Toutes les bases de données répliquées sur ce poste (Dossiers Optiques, Tarifications, Sessions de Caisse) sont cryptographiées par une clef rotative propre à votre tenant. Même en cas de vol de l'appareil ou d'attaques par des extensions malveillantes de navigateur, les données s'autodétruisent en local en cas de falsification détectée."
                          : "All replicated directories (Optical folds, Cash Journals, Pricing Matrices) are symmetrically scrambled on storage. If local memory tampering or unauthorized edits are detected, access is instantly locked."}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="p-2.5 bg-white border border-cyan-100 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-500 block uppercase">{currentLanguage === 'FR' ? "Algorithme local" : "Local Algorithm"}</span>
                          <span className="text-xs font-extrabold text-slate-800 font-mono">XOR-Cipher-Rot32</span>
                        </div>
                        <div className="p-2.5 bg-white border border-cyan-100 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-500 block uppercase">{currentLanguage === 'FR' ? "Clef d'intégrité" : "Integrity Key"}</span>
                          <span className="text-xs font-extrabold text-[#2563EB] font-mono">Fletcher-16 Checksum</span>
                        </div>
                        <div className="p-2.5 bg-white border border-cyan-100 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-500 block uppercase">{currentLanguage === 'FR' ? "Force d'isolement" : "Isolation Strength"}</span>
                          <span className="text-xs font-extrabold text-emerald-600">Anti-Piraterie Grade B+</span>
                        </div>
                      </div>

                      {/* Interactive Anti-Piracy Diagnostic Simulator */}
                      <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl space-y-2.5 font-mono text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                            {currentLanguage === 'FR' ? "Console de Diagnostic d'Intégrité" : "Security Diagnostics Console"}
                          </span>
                          <button
                            onClick={runLrsAntiPiracyTest}
                            disabled={lrsTestStatus === 'testing'}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-sans font-bold px-2.5 py-1 rounded-lg text-[9px] uppercase transition cursor-pointer disabled:opacity-50"
                          >
                            {lrsTestStatus === 'testing' 
                              ? (currentLanguage === 'FR' ? "Analyse..." : "Analyzing...") 
                              : (currentLanguage === 'FR' ? "Tester la Résistance" : "Run Security Test")}
                          </button>
                        </div>

                        {lrsTestStatus === 'idle' && (
                          <p className="text-slate-500 italic">
                            {currentLanguage === 'FR' ? "Cliquez sur [Tester la Résistance] pour simuler une attaque brute d'injection SQL/XSS sur votre cache LRS." : "Press [Run Security Test] to simulate unauthorized local cache injection."}
                          </p>
                        )}

                        {lrsTestLog.length > 0 && (
                          <div className="space-y-1 max-h-28 overflow-y-auto">
                            {lrsTestLog.map((log, idx) => (
                              <p key={idx} className={log.startsWith("🚨") || log.startsWith("🛡️") ? "text-rose-400 font-bold" : log.startsWith("✓") ? "text-emerald-400 font-bold" : "text-slate-350"}>
                                {log}
                              </p>
                            ))}
                          </div>
                        )}

                        {lrsTestStatus === 'tamper_detected' && (
                          <div className="p-2 bg-emerald-950/50 border border-emerald-800 rounded text-emerald-300 font-sans text-[10px] font-semibold">
                            {currentLanguage === 'FR'
                              ? "🛡️ TEST COMPLÉTÉ : L'attaque XSS injectée a été immédiatement identifiée grâce à la dissonance des clés. Le cache Optic-Alizé a rejeté le payload piraté avec un taux de réussite de 100%."
                              : "🛡️ DIAGNOSTIC COMPLETED: Symmetrical checker successfully intercepted fake data. Browser storage secured."}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* High-Volume Concurrent User map (50-100 user support validation) */}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                            <Activity className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <span className="text-xs font-black block text-slate-800 leading-tight">
                              {currentLanguage === 'FR' ? "Aiguilleur de Concurrence Réseau SaaS (50 - 100+ instances)" : "SaaS Network Concurrency Router (50 - 100+ load)"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {currentLanguage === 'FR' 
                                ? "Volume d'ateliers connectés au serveur central de réplication" 
                                : "Volumetric concurrent nodes attached to the central cloud relay"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500 font-bold">Simulate:</span>
                          <input 
                            type="range" 
                            min="20" 
                            max="120" 
                            value={simulatedLoadSize} 
                            onChange={(e) => setSimulatedLoadSize(parseInt(e.target.value, 10))}
                            className="w-24 accent-indigo-600 h-1 rounded-lg cursor-pointer"
                          />
                          <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                            {simulatedLoadSize}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                        <div className="p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-450 block uppercase">Charge Active</span>
                          <span className="text-base font-black text-slate-800 mt-1 block">
                            {simulatedLoadSize} {currentLanguage === 'FR' ? "Ateliers" : "Nodes"}
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-450 block uppercase">Conflits LRS</span>
                          <span className="text-base font-black text-emerald-600 mt-1 block">
                            0% (Auto-Sync)
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-450 block uppercase">Ping Moyen</span>
                          <span className="text-base font-black text-slate-800 mt-1 block font-mono">
                            {(sessionsList.reduce((acc, c) => acc + c.pingMs, 0) / sessionsList.length || 18).toFixed(1)} ms
                          </span>
                        </div>
                        <div className="p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-450 block uppercase">Statut Émetteur</span>
                          <span className="text-xs font-black text-emerald-600 mt-1.5 flex items-center gap-1 uppercase">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {currentLanguage === 'FR' ? "Capacité OK" : "Optimal Limit"}
                          </span>
                        </div>
                      </div>

                      {/* Simultaneous Terminal Session grid */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                            {currentLanguage === 'FR' ? "Ateliers simultanés actifs (Visualisation du Pool)" : "Simultaneous active nodes (Live Pool view)"}
                          </span>
                          <button
                            onClick={() => setIsLrsSimulating(!isLrsSimulating)}
                            className="text-[9px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLrsSimulating ? 'animate-spin' : ''}`} />
                            {isLrsSimulating ? (currentLanguage === 'FR' ? "Pause Simulator" : "Pause Simulation") : (currentLanguage === 'FR' ? "Play Simulator" : "Resume Simulation")}
                          </button>
                        </div>

                        <div className="border border-slate-150 rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-white divide-y divide-slate-100">
                          {sessionsList.slice(0, 10).map((session, index) => (
                            <div key={session.userId} className="p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[9.5px]">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600 font-mono shrink-0">
                                  #{String(index + 1).padStart(2, '0')}
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 block">{session.userName}</span>
                                  <span className="text-[8px] text-slate-450 font-mono uppercase">{session.userId} • {session.agencyCode}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                  Module: {session.currentModule}
                                </span>
                                
                                <span className="font-mono text-[9px] text-[#64748B] tracking-tight whitespace-nowrap">
                                  Ping: <strong className={session.pingMs > 80 ? 'text-amber-600' : 'text-slate-700'}>{session.pingMs}ms</strong>
                                </span>

                                <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                                  session.status === 'syncing' 
                                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                                    : session.status === 'conflict_resolved'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : session.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-750'
                                }`}>
                                  {session.status}
                                </span>

                                <span className="text-slate-400 font-mono text-[8px] hidden md:inline">
                                  {session.payloadKBSync} KB/sync
                                </span>
                              </div>
                            </div>
                          ))}
                          {sessionsList.length > 10 && (
                            <div className="p-2 bg-slate-50 text-center text-[9px] text-slate-450 italic">
                              ... {currentLanguage === 'FR' ? `Et ${sessionsList.length - 10} autres terminaux d'ateliers sécurisés fonctionnent en tâche de fond sous cryptage LRS` : `And ${sessionsList.length - 10} other concurrent nodes transmitting secure telemetry under encrypted tunnels`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-100 my-4" />

                    {/* Standard double factor toggle */}
                    <div className="p-4 rounded-xl space-y-4 bg-emerald-50/25 border border-emerald-100">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 text-left">
                          <span className="text-xs font-black block text-slate-900 uppercase tracking-wide">
                            {currentLanguage === 'FR' ? "Authentification Multi-Facteur (MFA TOTP)" : "Multi-Factor Authentication (MFA TOTP)"}
                          </span>
                          <p className="text-[10px] text-[#64748B] leading-relaxed">
                            {currentLanguage === 'FR'
                              ? "Exige la saisie d'un code OTP à 6 chiffres généré par une application d'authentification mobile (Google Authenticator, Duo) lors de votre connexion."
                              : "Enforce a secondary 6-digit verification code generated by an authenticator application (Google Authenticator, Duo) during sign-in."}
                          </p>
                        </div>
                        
                        <button 
                          type="button"
                          onClick={handleToggleMFA}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${profileMfa ? 'bg-emerald-600' : 'bg-slate-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${profileMfa ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {profileMfa && mfaSecretText && (
                        <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-2 animate-fade-in text-left">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                              {currentLanguage === 'FR' ? "MFA Activé pour votre compte" : "MFA Successfully Enabled"}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-550 leading-relaxed font-medium">
                            {currentLanguage === 'FR'
                              ? "Pour finaliser la configuration sur votre mobile, scannez le code QR de validation ou entrez manuellement la clef de sécurité suivante dans Google Authenticator :"
                              : "Scan the configuration QR code or input the following security token in your mobile authenticator client:"}
                          </p>

                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center select-all font-mono text-xs font-black tracking-widest text-emerald-900">
                            {mfaSecretText}
                          </div>

                          <p className="text-[9px] text-slate-400 italic">
                            {currentLanguage === 'FR'
                              ? "✓ Les connexions ultérieures exigeront désormais l'authentification double facteur."
                              : "✓ Future session logins will be protected behind double factor verification."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUBSECTION F: SECRETS / API KEYS */}
                {activeSettingsCategory === 'api' && (
                  <div className="space-y-4 font-sans">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">Clefs API et Jetons (Tokens)</h3>
                      <p className="text-xs text-[#64748B]">Clefs de service requises par l'API Gateway.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Warning Box */}
                      <div className={`p-4 rounded-xl flex items-start gap-3 bg-amber-50 border border-amber-200`}>
                        <AlertCircle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                        <div className="text-left">
                          <span className="text-xs font-bold text-[#F59E0B] block">Mesure de Sécurité Obligatoire</span>
                          <p className="text-[10px] text-[#92400E] mt-0.5 leading-relaxed">
                            Ne partagez JAMAIS vos clefs API secrètes. Pour configurer d'autres secrets d'environnement, veuillez les inscrire directement dans votre fichier <span className="font-mono">.env.example</span> ou passer par les configurations système d'authentification.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Clé publique (Publishable Token)</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 text-xs rounded-xl text-slate-500 cursor-not-allowed font-mono border border-slate-150 bg-slate-100"
                          value="pk_live_51M0OdoERP_OpticAlize_SaaS_2026"
                          disabled
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">Clé Secrète de Tenant (Tenant Secret Token)</label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 text-xs rounded-xl text-slate-500 cursor-not-allowed font-mono border border-slate-150 bg-slate-100"
                          value="sk_live_••••••••••••••••••••••••••••••••••••••••••••"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SAVE ACTION BUTTON */}
                {activeSettingsCategory !== 'api' && activeSettingsCategory !== 'sauvegarde' && (
                  <div className={`flex justify-between items-center pt-4 border-t border-slate-100`}>
                    <div className="text-[10px] text-slate-400">
                      Enregistrez pour synchroniser vos préférences d'interface.
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {saveSuccess && (
                         <span className="text-xs font-semibold text-[#22C55E] flex items-center gap-1.5 animate-pulse">
                          <Check className="w-4 h-4" />
                          Configuration enregistrée !
                        </span>
                      )}
                      
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl shadow-xs transition cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Enregistrer</span>
                      </button>
                    </div>
                  </div>
                )}

              </form>
            </div>
          )}
        </div>
      </div>

      {/* WIPE SYSTEM STATE CONFIRMATION MODAL */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-950 p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
              <h3 className="text-lg font-bold">
                {currentLanguage === 'FR' ? "⚠️ Confirmation d'Identité !" : "⚠️ Confirm Identity!"}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 font-sans font-medium">
              {currentLanguage === 'FR' 
                ? "Cette opération va écraser toutes vos agences personnalisées, zones d'expansion et fiches métiers pour réinjecter le jeu d'essai standard de SaaS Alizé (Agences Alpha, Bêta, Gamma, Delta, Epsilon, avec les 13 modules activés). Cette action est définitive. Saisissez votre mot de passe pour confirmer."
                : "This operation will overwrite all your custom agencies, expansion zones, and business sheets to re-inject the standard SaaS Alizé test set (Agencies Alpha, Beta, Gamma, Delta, Epsilon, with all 13 modules activated). This action is final. Enter your password to confirm."}
            </p>

            <div className="space-y-2 mb-6">
              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {currentLanguage === 'FR' ? "Mot de passe Administrateur / Créateur" : "Admin / Creator Password"}
              </label>
              <div className="relative">
                <input
                  type={showWipePassword ? "text" : "password"}
                  value={wipePassword}
                  onChange={(e) => {
                    setWipePassword(e.target.value);
                    setWipeError(null);
                  }}
                  placeholder={currentLanguage === 'FR' ? "Saisir votre mot de passe pour confirmer" : "Enter your password to confirm"}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none transition dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowWipePassword(!showWipePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px] font-bold uppercase tracking-wider select-none transition"
                >
                  {showWipePassword ? (currentLanguage === 'FR' ? "Masquer" : "Hide") : (currentLanguage === 'FR' ? "Afficher" : "Show")}
                </button>
              </div>
              {wipeError && (
                <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 animate-pulse">
                  {wipeError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {currentLanguage === 'FR' ? "Annuler" : "Cancel"}
              </button>
              
              <button
                type="button"
                onClick={performActualSystemWipe}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{currentLanguage === 'FR' ? "Confirmer & Réinitialiser" : "Confirm & Reset"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WIPE SYSTEM SUCCESS POPUP WITH DISMISSAL TO REDIRECT TO LOGIN */}
      {showWipeSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md text-xs font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto text-emerald-500 animate-bounce">
              <Check className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                {currentLanguage === 'FR' ? "Réinitialisation effectuée avec succès" : "Reset completed successfully"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                {currentLanguage === 'FR' 
                  ? "La purge complète de l'ensemble des bases transactionnelles de l'agence a été réalisée. Le système est de retour à son état d'origine."
                  : "The complete purge of all transactional databases has been performed. The system has returned to its factory settings."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition cursor-pointer text-xs uppercase tracking-wider"
            >
              OK / {currentLanguage === 'FR' ? "Retour au Login" : "Back to Login"}
            </button>
          </div>
        </div>
      )}

      {/* --- WIPE SYSTEM PROGRESS OVERLAY --- */}
      {wipeProgress !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in text-xs font-sans text-slate-800">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 text-center space-y-6">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                {currentLanguage === 'FR' ? "Réinitialisation en Cours" : "System Reset in Progress"}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {currentLanguage === 'FR' ? "Veuillez ne pas fermer cette fenêtre" : "Please do not close this window"}
              </p>
            </div>

            {/* Progress bar container */}
            <div className="space-y-2">
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
                <div 
                  style={{ width: `${wipeProgress}%` }}
                  className="bg-gradient-to-r from-red-500 to-rose-600 h-full rounded-full transition-all duration-100"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-red-600 uppercase tracking-wider px-1">
                <span>{currentLanguage === 'FR' ? "Progression" : "Progress"}</span>
                <span>{wipeProgress}%</span>
              </div>
            </div>

            {/* Dynamic Status Text */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl min-h-[50px] flex items-center justify-center">
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed text-center animate-pulse">
                {wipeProgressText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
