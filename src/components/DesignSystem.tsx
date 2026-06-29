import React, { useState } from 'react';
import { 
  Sun, Moon, Menu, Bell, Search, User, ChevronRight, ChevronLeft,
  Settings, HelpCircle, Eye, Info, CheckCircle2, AlertTriangle, 
  Trash2, Plus, Download, Edit, ArrowUpDown, Filter, X, EyeOff,
  UserCheck, Shield, BarChart3, Sliders, Play, Copy, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Definitions for Design System Types
type ThemeMode = 'light' | 'dark';

export default function DesignSystem() {
  const theme = 'light';
  
  // States to track preview modals, drawers, and form values
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form states
  const [formFields, setFormFields] = useState({
    clientName: 'Jean-Marc Dupont',
    isMfaEnabled: true,
    userRole: 'Opticien',
    prescriptionPower: -2.75,
    glassType: 'Progressif Haute Définition',
    notes: 'Précision sur axe 90° requis par l\'ophtalmologue.',
    acceptGdpr: true
  });

  const [formErrorState, setFormErrorState] = useState(false);

  // Interactivité du générateur de composants réutilisables
  const [genConfig, setGenConfig] = useState({
    type: 'button',
    variant: 'filled',
    color: 'blue',
    size: 'md',
    icon: true,
    label: 'Enregistrer l\'ordonnance'
  });

  // Mock Data for DataTable
  const mockTableData = [
    { id: 1024, client: 'Alice Bernard', rdv: '09/06/2026', type: 'Examen de vue', status: 'Terminé', price: '129.00 €', branch: 'Paris Nation' },
    { id: 1025, client: 'Marc Antoine', rdv: '09/06/2026', type: 'Livraison Monture', status: 'En cours', price: '450.00 €', branch: 'Lyon Bellecour' },
    { id: 1026, client: 'Sophie Kowalski', rdv: '10/06/2026', type: 'Prise de mesures', status: 'En attente', price: '89.00 €', branch: 'Paris Nation' },
    { id: 1027, client: 'Guillaume Tell', rdv: '11/06/2026', type: 'Ajustement optique', status: 'Annulé', price: '0.00 €', branch: 'Marseille Vieux-Port' },
    { id: 1028, client: 'Yasmine Alami', rdv: '12/06/2026', type: 'Réfraction complexe', status: 'Terminé', price: '210.00 €', branch: 'Bordeaux Centre' },
    { id: 1029, client: 'Philippe Duval', rdv: '15/06/2026', type: 'Adaptation Lentilles', status: 'Terminé', price: '180.00 €', branch: 'Lyon Bellecour' },
    { id: 1030, client: 'Camille Lartigue', rdv: '18/06/2026', type: 'Vente Directe Accessoires', status: 'En cours', price: '45.00 €', branch: 'Paris Nation' },
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText('Copié !');
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Helper arrays for items
  const totalPages = Math.ceil(mockTableData.length / itemsPerPage);
  const currentTableData = mockTableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectRow = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === currentTableData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentTableData.map(r => r.id));
    }
  };

  // Custom code snippet matching active config
  const getGeneratedComponentCode = () => {
    if (genConfig.type === 'button') {
      const bgStyle = genConfig.variant === 'filled' 
        ? (genConfig.color === 'blue' ? 'bg-[#0097A7] hover:bg-[#00838F] text-white shadow-md' : 'bg-[#00BCD4] hover:bg-[#00ACC1] text-white shadow-md')
        : genConfig.variant === 'outlined'
          ? `border border-${genConfig.color === 'blue' ? '[#0097A7]' : '[#00BCD4]'} text-${genConfig.color === 'blue' ? '[#0097A7]' : '[#00BCD4]'} hover:bg-slate-150`
          : genConfig.variant === 'tonal'
            ? `bg-${genConfig.color === 'blue' ? 'cyan-500/10' : 'teal-500/10'} text-${genConfig.color === 'blue' ? '[#0097A7]' : '[#00BCD4]'} hover:bg-opacity-20`
            : `text-${genConfig.color === 'blue' ? '[#0097A7]' : '[#00BCD4]'} hover:underline`;

      const sizePadding = genConfig.size === 'sm' ? 'px-3 py-1.5 text-xs' : genConfig.size === 'lg' ? 'px-6 py-3.5 text-base font-semibold' : 'px-5 py-2.5 text-sm font-medium';
      const m3Rounded = 'rounded-full transition-all duration-300 flex items-center gap-2 tracking-wide font-sans cursor-pointer';

      return `// Bouton G-LAB OPTIC MD3 Réutilisable
import { Plus } from 'lucide-react';

export function Button() {
  return (
    <button className="${m3Rounded} ${bgStyle} ${sizePadding}">
      ${genConfig.icon ? '<Plus className="w-4 h-4" />' : ''}
      <span>${genConfig.label}</span>
    </button>
  );
}`;
    } else {
      // Input
      return `// Champ de Saisie G-LAB OPTIC MD3
export function CustomInput() {
  return (
    <div className="relative font-sans w-full">
      <input
        type="text"
        placeholder=" "
        className="w-full px-4 pt-5 pb-1.5 text-sm bg-transparent border border-gray-300 rounded-lg text-[#1F2937] transition-all focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] peer outline-none"
      />
      <label className="absolute left-4 top-1.5 text-[10px] text-gray-500 transition-all font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#0097A7] pointer-events-none">
        Nom complet du client
      </label>
    </div>
  );
}`;
    }
  };

  return (
    <div id="design-system-root" className="w-full select-none">
      
      {/* Intro descriptive card */}
      <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-display font-semibold tracking-tight text-[#714B67] flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-[#714B67] rounded-lg">
              <Layers className="w-4 h-4" />
            </span>
            Système de Design G-LAB Officiel
          </h2>
          <p className="text-xs text-slate-700 mt-1 max-w-3xl font-sans leading-relaxed">
            Spécification UX de l'ERP conçue avec l'esthétique épurée et l'efficacité de <strong>G-LAB</strong>. Ce bac à sable interactif démontre la palette officielle d'applications intégrées, les grilles de données, les formulaires de ordonnances de lunetterie et les dialogues modulaires.
          </p>
        </div>
      </div>

      {/* Main Sandbox Interactive Frame */}
      <div 
        id="design-system-viewport"
        className={`w-full rounded-2xl transition-all duration-500 border overflow-hidden shadow-2xl ${
          theme === 'light' 
            ? 'bg-[#F2F4F7] text-[#1F2937] border-white' 
            : 'bg-[#0b0f19] text-[#E2E8F0] border-slate-900'
        }`}
      >
        
        {/* Mini MD3 Interactive Header / AppBar */}
        <header 
          id="m3-appbar-sandbox"
          className={`flex items-center justify-between px-6 py-3.5 border-b tracking-wide transition-colors duration-300 ${
            theme === 'light' 
              ? 'bg-[#FFFFFF] border-slate-200 text-[#1F2937] shadow-sm' 
              : 'bg-[#121826] border-slate-800 text-[#F5F7FA]'
          }`}
        >
          {/* Logo & Responsive Title */}
          <div className="flex items-center gap-3">
            <button className={`p-2 rounded-full cursor-pointer transition ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'}`}>
              <Menu className="w-5 h-5 text-[#0097A7]" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-lg bg-[#0097A7] text-white font-bold flex items-center justify-center font-display text-sm">G</span>
              <span className="font-display font-bold text-sm tracking-tight hidden sm:inline">G-LAB OPTIC</span>
            </div>
            {/* MD3 Active System Pills */}
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-medium ${theme === 'light' ? 'bg-[#00BCD4]/10 text-[#00838F]' : 'bg-[#00BCD4]/20 text-[#00E5FF]'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              SESSION : DIRECTEUR GÉNÉRAL
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="relative max-w-xs w-full hidden sm:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="w-4 h-4 text-[#0097A7]/70" />
            </span>
            <input 
              type="text" 
              placeholder="Rechercher dossiers, montures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-1.5 pl-10 pr-4 text-xs rounded-full border outline-none tracking-wide transition-all ${
                theme === 'light' 
                  ? 'bg-slate-50 border-slate-200 focus:border-[#0097A7] text-[#1F2937] focus:bg-white' 
                  : 'bg-[#1B2335] border-slate-800 focus:border-[#00BCD4] text-[#E2E8F0] focus:bg-[#1E293B]'
              }`}
            />
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <button className={`p-2 rounded-full relative cursor-pointer transition ${theme === 'light' ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'}`}>
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
            </button>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className={`p-2 rounded-full cursor-pointer transition ${theme === 'light' ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-300'}`}
              title="Ouvrir le Drawer de Profil"
            >
              <User className="w-4.5 h-4.5 text-[#0097A7]" />
            </button>
            
            {/* Quick action button MD3 Fab mini */}
            <button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-[#00BCD4] hover:bg-[#0097A7] text-white p-2 rounded-full shadow-lg cursor-pointer transition flex items-center justify-center transform hover:scale-105"
              title="Ajouter nouveau client"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Dashboard Surface Shell: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row w-full min-h-[580px]">
          
          {/* Sidebar Left Component */}
          <aside 
            id="m3-sidebar-sandbox"
            className={`w-full lg:w-60 p-4 shrink-0 border-r lg:border-b-0 border-b transition-colors duration-300 ${
              theme === 'light' 
                ? 'bg-[#FFFFFF] border-slate-200 text-[#1F2937]' 
                : 'bg-[#121826] border-slate-850 text-[#94A3B8]'
            }`}
          >
            <div className="space-y-6">
              
              {/* Sidebar Section 1 */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-mono text-[#0097A7] font-semibold mb-3 px-3">
                  Espace Commercial
                </p>
                <div className="space-y-1">
                  <a href="#dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition duration-200 ${
                    theme === 'light' 
                      ? 'bg-[#0097A7]/10 text-[#00838F]' 
                      : 'bg-[#0097A7]/15 text-[#00E5FF]'
                  }`}>
                    <BarChart3 className="w-4 h-4" />
                    <span>Tableau de bord</span>
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  </a>

                  <a href="#inventory" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition duration-200 ${
                    theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}>
                    <Sliders className="w-4 h-4" />
                    <span>Réfraction & Médical</span>
                  </a>

                  <a href="#sales" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition duration-200 ${
                    theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}>
                    <Sliders className="w-4 h-4" />
                    <span>Facturation & Caisse</span>
                    <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full ${theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>
                      3 rdv
                    </span>
                  </a>
                </div>
              </div>

              {/* Sidebar Section 2: Administrateur & RBAC */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-mono text-[#0097A7] font-semibold mb-3 px-3">
                  CONTRÔLE ADMINISTRATIF
                </p>
                <div className="space-y-1">
                  <a href="#users" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition duration-200 ${
                    theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}>
                    <UserCheck className="w-4 h-4" />
                    <span>Employés & Rôles (RBAC)</span>
                  </a>

                  <a href="#logs" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition duration-200 ${
                    theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}>
                    <Shield className="w-4 h-4" />
                    <span>Audit & Sécurité logs</span>
                  </a>
                </div>
              </div>

              {/* Quick Widget Indicator */}
              <div className={`p-3.5 rounded-xl border font-sans text-xs ${
                theme === 'light' 
                  ? 'bg-slate-50 border-slate-200/60 text-slate-500' 
                  : 'bg-[#182030] border-slate-800/60 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 mb-1.5 font-medium text-[#0097A7]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>MFA 2FA STATUS</span>
                </div>
                <p className="text-[10px] leading-relaxed">Le rôle <strong>Directeur Général</strong> requiert une validation biométrique ou TOTP toutes les 24h.</p>
              </div>

            </div>
          </aside>

          {/* Sandbox Body Content */}
          <main className="flex-1 p-6 space-y-8 overflow-x-hidden">
            
            {/* Visual Header containing design system metrics */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-display font-bold tracking-tight text-[#0097A7]">
                  G-Lab Optic ERP Design System Sandbox
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                  Visualisez, testez et exportez les composants réutilisables MD3.
                </p>
              </div>
              
              {/* Quick Switch controls for active RBAC simulate role */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-slate-400">Rôle simulé :</span>
                <select 
                  value={formFields.userRole}
                  onChange={(e) => setFormFields({...formFields, userRole: e.target.value})}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#0097A7] cursor-pointer ${
                    theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 text-slate-700' : 'bg-[#121826] border-slate-800 text-white'
                  }`}
                >
                  <option>Super Administrateur</option>
                  <option>Directeur Général</option>
                  <option>Gérant Boutique</option>
                  <option>Opticien</option>
                  <option>Caissier</option>
                  <option>Comptable</option>
                </select>
              </div>
            </div>

            {/* Dashboard widgets cards (Dashboard Cards) */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097A7] mb-4">
                1. Cartes de Tableau de bord & Widgets (Dashboard Cards)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* Card 1: Revenue widget with dynamic outline & shadow */}
                <div className={`p-5 rounded-2xl transition hover:shadow-lg border flex flex-col justify-between ${
                  theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 text-slate-800' : 'bg-[#121826] border-slate-800/80 text-emerald-100'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Chiffre d’Affaires Mensuel</span>
                    <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">+14.2%</span>
                  </div>
                  <div className="my-3">
                    <p className="text-2xl font-bold font-display tracking-tight text-[#0097A7]">42,590.00 €</p>
                    <p className="text-[10px] text-slate-400 mt-1">Ref : Mutuelles + Ventes privées</p>
                  </div>
                  {/* Miniature SVG graphic showing trends inside card */}
                  <div className="h-8 w-full mt-1">
                    <svg viewBox="0 0 100 20" className="w-full h-full stroke-[#00BCD4] fill-none" strokeWidth="2" strokeLinecap="round">
                      <path d="M0 15 Q 15 5, 30 18 T 60 5 T 90 2 T 100 8" />
                    </svg>
                  </div>
                </div>

                {/* Card 2: Refractions / medical prescriptions */}
                <div className={`p-5 rounded-2xl transition hover:shadow-lg border flex flex-col justify-between ${
                  theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 text-slate-800' : 'bg-[#121826] border-slate-800/80 text-slate-100'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Réfractions Exécutées</span>
                    <span className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded-full">Objectif 90%</span>
                  </div>
                  <div className="my-3 flex items-baseline gap-2">
                    <p className="text-2xl font-bold font-display tracking-tight">87 dossiers</p>
                    <span className="text-xs text-slate-400 font-medium">/ 100</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] h-full rounded-full" style={{ width: '87%' }}></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Sous-traitance tiers : Validation Secu passée</p>
                </div>

                {/* Card 3: Multi-boutiques Sync Status */}
                <div className={`p-5 rounded-2xl transition hover:shadow-lg border flex flex-col justify-between ${
                  theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 text-slate-800' : 'bg-[#121826] border-slate-800/80 text-slate-100'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Synchronisation Boutiques</span>
                    <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Actif
                    </span>
                  </div>
                  <div className="my-3">
                    <p className="text-2xl font-bold font-display tracking-tight text-cyan-500">12 / 12</p>
                    <p className="text-[10px] text-slate-400 mt-1">Terminal de paiements et stocks unifiés.</p>
                  </div>
                  <div className="text-[10px] flex justify-between pt-1 border-t border-slate-250 dark:border-slate-850 text-slate-500">
                    <span>Dernier ping: il y a 2s</span>
                    <span>Version V4.2</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Interactive Components showcase grid: 2. Buttons & 3. Forms */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* Part 2: Buttons */}
              <div className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-[#FFFFFF] border-slate-200' : 'bg-[#121826] border-slate-850'}`}>
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097A7] mb-4">
                  2. Boutons & États Interactifs (Material 3 Buttons)
                </h4>
                
                <div className="space-y-6">
                  
                  {/* Buttons gallery row */}
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">Variantes de Boutons</p>
                    <div className="flex flex-wrap gap-3 items-center">
                      
                      {/* MD3 Button Filled */}
                      <button className="bg-[#0097A7] hover:bg-[#00838F] active:scale-95 text-white text-xs font-medium px-5 py-2.5 rounded-full shadow-md cursor-pointer transition flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Filled (Principal)
                      </button>

                      {/* MD3 Button Outlined */}
                      <button className={`border border-[#00BCD4] text-[#0097A7] hover:bg-[#00BCD4]/10 active:scale-95 text-xs font-medium px-5 py-2.5 rounded-full cursor-pointer transition flex items-center gap-2`}>
                        Outlined (Secondaire)
                      </button>

                      {/* MD3 Button Tonal (Quiet Background) */}
                      <button className="bg-[#00BCD4]/10 hover:bg-[#00BCD4]/20 active:scale-95 text-[#0097A7] text-xs font-medium px-5 py-2.5 rounded-full cursor-pointer transition flex items-center gap-2">
                        Tonal Primary
                      </button>

                      {/* MD3 Button Text Only */}
                      <button className="text-[#0097A7] hover:bg-[#00BCD4]/10 text-xs font-medium px-5 py-2.5 rounded-full cursor-pointer transition flex items-center gap-2">
                        Texte simple
                      </button>

                    </div>
                  </div>

                  {/* Icon Buttons & FAB details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Floating Action Button (FAB) demonstration under MD3 standards */}
                    <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">FAB (Floating Action Button)</p>
                      <div className="flex items-center gap-4">
                        <button className="w-14 h-14 bg-[#0097A7] hover:bg-[#00838F] text-white rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center cursor-pointer transition transform hover:scale-105 active:scale-95">
                          <Plus className="w-6 h-6" />
                        </button>
                        <button className="px-5 py-3 bg-[#00BCD4] hover:bg-[#0097A7] text-white rounded-2xl shadow-lg hover:shadow-xl flex items-center gap-3 cursor-pointer transition transform hover:scale-105 active:scale-95 text-xs font-bold uppercase tracking-wide">
                          <Plus className="w-5 h-5" />
                          <span>NOUVEAU DOSSIER</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">Style MD3 : Coins adoucis carrés (rounded-2xl) au lieu de complèment ronds.</p>
                    </div>

                    {/* Disabled and Hover simulations */}
                    <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">États de validation & Désactivé</p>
                      <div className="flex gap-2">
                        <button disabled className="bg-slate-350 dark:bg-slate-800 text-slate-500 cursor-not-allowed text-xs px-4 py-2.5 rounded-full font-medium transition">
                          Composant Inactif
                        </button>
                        <button className="bg-emerald-600/25 border border-emerald-500 text-emerald-400 text-xs px-4 py-2.5 rounded-full font-medium flex items-center gap-1.5 cursor-default">
                          <CheckCircle2 className="w-4 h-4" />
                          Succès
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Part 3: Forms */}
              <div className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-[#FFFFFF] border-slate-200' : 'bg-[#121826] border-slate-850'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097A7]">
                    3. Formulaires (Material 3 TextFields & Controls)
                  </h4>
                  <button 
                    onClick={() => setFormErrorState(!formErrorState)} 
                    className={`text-[10px] font-medium px-2 py-1 rounded-full border transition cursor-pointer ${formErrorState ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'}`}
                  >
                    {formErrorState ? 'Masquer Erreur' : 'Simuler Validation Erreur'}
                  </button>
                </div>

                <div className="space-y-4">
                  
                  {/* Text field Outlined and label float simulator */}
                  <div className="relative w-full">
                    <input 
                      type="text" 
                      value={formFields.clientName}
                      onChange={(e) => setFormFields({...formFields, clientName: e.target.value})}
                      className={`w-full px-4 pt-5 pb-1.5 text-xs rounded-lg border outline-none font-sans transition-all peer ${
                        formErrorState 
                          ? 'border-red-500 bg-red-500/5 focus:border-red-600' 
                          : theme === 'light' 
                            ? 'bg-slate-50/50 border-slate-200 focus:border-[#0097A7] text-slate-800' 
                            : 'bg-[#182030] border-slate-800 focus:border-[#00BCD4] text-white'
                      }`}
                      placeholder=" "
                    />
                    <label className={`absolute left-4 top-1.5 transition-all text-[10px] font-bold ${
                      formErrorState 
                        ? 'text-red-500' 
                        : 'text-[#0097A7]'
                    } peer-placeholder-shown:text-xs peer-placeholder-shown:top-3.5 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#00BCD4]`}>
                      Nom Complet du Client
                    </label>
                    {formErrorState && (
                      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1 pl-1">
                        <AlertTriangle className="w-3 H-3" />
                        Erreur : Le dossier client est requis pour la validation mutuelle.
                      </p>
                    )}
                  </div>

                  {/* Preset Dropdowns & Selects */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Type de Verres Commandés</label>
                      <select 
                        value={formFields.glassType}
                        onChange={(e) => setFormFields({...formFields, glassType: e.target.value})}
                        className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#0097A7] cursor-pointer ${
                          theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 text-slate-700' : 'bg-[#1B2335] border-slate-800 text-white'
                        }`}
                      >
                        <option>Progressif Haute Définition</option>
                        <option>Monofocal Filtre Bleu</option>
                        <option>Bifocal Anti-reflets</option>
                        <option>Photochromique Essilor V4</option>
                      </select>
                    </div>

                    {/* Numeric Presets slider */}
                    <div>
                      <div className="flex justify-between text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                        <span>Puissance Sphère S2 (Dioptrie)</span>
                        <span className="text-[#0097A7] font-sans">{formFields.prescriptionPower} dpt</span>
                      </div>
                      <input 
                        type="range" 
                        min="-10" 
                        max="10" 
                        step="0.25"
                        value={formFields.prescriptionPower}
                        onChange={(e) => setFormFields({...formFields, prescriptionPower: parseFloat(e.target.value)})}
                        className="w-full accent-[#0097A7] h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Textarea notes section */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Instructions Techniques (Atelier de Réfraction)</label>
                    <textarea 
                      rows={2}
                      value={formFields.notes}
                      onChange={(e) => setFormFields({...formFields, notes: e.target.value})}
                      className={`w-full p-3 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#0097A7] resize-none ${
                        theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#1B2335] border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  {/* Selection Checkboxes / Toggle switches matching Material 3 specifications */}
                  <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-4 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                    
                    {/* Switch: Multi-factor token */}
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setFormFields({...formFields, isMfaEnabled: !formFields.isMfaEnabled})}
                        className={`w-11 h-6 rounded-full cursor-pointer relative transition duration-300 p-0.5 select-none ${
                          formFields.isMfaEnabled ? 'bg-[#0097A7]' : 'bg-slate-350 dark:bg-slate-800'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full bg-white flex items-center justify-center transform transition duration-300 shadow ${
                          formFields.isMfaEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                      <div>
                        <span className="text-xs font-semibold block transition">MFA Double Authentification</span>
                        <span className="text-[10px] text-slate-400 block font-mono">2FA exigée pour encadrement</span>
                      </div>
                    </div>

                    {/* Standard checked checkbox */}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={formFields.acceptGdpr}
                        onChange={(e) => setFormFields({...formFields, acceptGdpr: e.target.checked})}
                        className="w-4.5 h-4.5 accent-[#0097A7] rounded border-slate-300 dark:border-slate-800"
                      />
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-tight">
                        Isolation RGPD & Sécurisation de l’anamnèse
                      </div>
                    </label>

                  </div>

                </div>
              </div>

            </div>

            {/* Part 4: Interactive Table, Graphics, and Pagination Demo */}
            <div className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-[#FFFFFF] border-slate-200' : 'bg-[#121826] border-slate-850'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097A7]">
                    4. Tables de Données, Pagination & Actions (DataTable Framework)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Simulez le tri, la sélection mutuelle et l'ouverture de fiches d'examens.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    theme === 'light' ? 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-600' : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}>
                    <Filter className="w-3.5 h-3.5 text-[#00BCD4]" />
                    Filtrer (Paris Nation)
                  </button>
                  <button className="bg-[#0097A7] hover:bg-[#00838F] text-white text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition flex items-center gap-1.5 shadow-md">
                    <Download className="w-3.5 h-3.5" />
                    Exporter
                  </button>
                </div>
              </div>

              {/* Data Table Wrapper */}
              <div className="w-full overflow-x-auto rounded-xl border border-slate-200/85 dark:border-slate-800/80">
                <table className="w-full text-left font-sans text-xs select-none">
                  
                  {/* Table Header */}
                  <thead className={`${theme === 'light' ? 'bg-[#F2F4F7] text-slate-600' : 'bg-[#0f1420] text-slate-400'} border-b border-slate-200/80 dark:border-slate-800/80`}>
                    <tr>
                      <th className="px-4 py-3 text-center w-10">
                        <input 
                          type="checkbox"
                          checked={selectedRows.length === currentTableData.length && currentTableData.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 accent-[#0097A7] cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 font-medium">CODE ID</th>
                      <th className="px-4 py-3 font-medium">BÉNÉFICIAIRE / CLIENT</th>
                      <th className="px-4 py-3 font-medium">TYPE DE RDV</th>
                      <th className="px-4 py-3 font-medium">RÉSERVE CHRONOLOGIQUE</th>
                      <th className="px-4 py-3 font-medium">SITE BOUTIQUE</th>
                      <th className="px-4 py-3 font-medium text-right">MONTANT TRANSACTION</th>
                      <th className="px-4 py-3 font-medium text-center">STATUT VERRE</th>
                      <th className="px-4 py-3 text-center">ACTIONS</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850/50">
                    {currentTableData.map((row) => (
                      <tr 
                        key={row.id} 
                        className={`transition duration-100 ${
                          selectedRows.includes(row.id)
                            ? theme === 'light' ? 'bg-[#00BCD4]/10' : 'bg-[#0097A7]/15'
                            : theme === 'light' ? 'hover:bg-slate-50bg-white' : 'hover:bg-slate-900/40 bg-[#121826]'
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => toggleSelectRow(row.id)}
                            className="w-4 h-4 accent-[#0097A7] cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-[#0097A7]">{row.id}</td>
                        <td className="px-4 py-3 font-semibold">{row.client}</td>
                        <td className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">{row.type}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{row.rdv}</td>
                        <td className="px-4 py-3 text-slate-500">{row.branch}</td>
                        <td className="px-4 py-3 font-mono font-bold text-right text-cyan-600 dark:text-cyan-400">{row.price}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium font-sans border ${
                            row.status === 'Terminé' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : row.status === 'En cours'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse'
                                : row.status === 'Annulé'
                                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => {
                                setFormFields({ ...formFields, clientName: row.client, notes: `Consultation optique réglée pour ${row.client} à l'atelier de ${row.branch}.` });
                                setIsDrawerOpen(true);
                              }}
                              className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#0097A7] transition cursor-pointer`}
                              title="Visualiser dossier"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                setIsDialogOpen(true);
                              }}
                              className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#00BCD4] transition cursor-pointer`}
                              title="Éditer prescription"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 text-xs">
                
                {/* Entries details */}
                <div className="text-slate-500 font-sans">
                  Affichage de <strong className="font-semibold text-slate-700 dark:text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</strong> à <strong className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(currentPage * itemsPerPage, mockTableData.length)}</strong> sur <strong className="font-semibold text-slate-700 dark:text-slate-300">{mockTableData.length}</strong> clients.
                </div>

                {/* Main UI Pagination buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 mr-1">Lignes par page :</span>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-1 rounded-lg border focus:outline-none cursor-pointer text-xs ${
                      theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 text-slate-700' : 'bg-[#182030] border-slate-850 text-white'
                    }`}
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={7}>7</option>
                  </select>

                  <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 overflow-hidden">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`p-1.5 rounded transition cursor-pointer ${currentPage === 1 ? 'text-slate-350 cursor-not-allowed' : 'text-[#0097A7] hover:bg-[#0097A7]/10'}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button 
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-7 h-7 text-center rounded text-xs font-semibold cursor-pointer transition-all ${
                          currentPage === i + 1
                            ? 'bg-[#0097A7] text-white'
                            : theme === 'light' 
                              ? 'text-slate-600 hover:bg-slate-100' 
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-1.5 rounded transition cursor-pointer ${currentPage === totalPages ? 'text-slate-350 cursor-not-allowed' : 'text-[#0097A7] hover:bg-[#0097A7]/10'}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Part 5: Component Builder and Dynamic Code generator (Reusable components preview) */}
            <div id="m3-builder-part" className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 shadow-sm' : 'bg-[#121826] border-slate-850'}`}>
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0097A7] mb-4">
                5. Générateur Interactif & Aperçu Code (Composants Réutilisables TS/Tailwind)
              </h4>
              <p className="text-xs text-slate-500 mb-6 font-sans">
                Personnalisez les jetons décoratifs ci-dessous et obtenez instantanément le code source conforme à notre design system pour vos applications d'ateliers et de facturation.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Builder Config Panels */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Type de Composant</label>
                      <select 
                        value={genConfig.type}
                        onChange={(e) => setGenConfig({...genConfig, type: e.target.value})}
                        className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#0097A7] cursor-pointer ${
                          theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 text-slate-700' : 'bg-[#182030] border-slate-800 text-white'
                        }`}
                      >
                        <option value="button">Bouton d'Action (Button)</option>
                        <option value="input">Champ de saisie (TextField)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Thème Accent</label>
                      <select 
                        value={genConfig.color}
                        onChange={(e) => setGenConfig({...genConfig, color: e.target.value})}
                        className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#0097A7] cursor-pointer ${
                          theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 text-slate-700' : 'bg-[#182030] border-slate-800 text-white'
                        }`}
                      >
                        <option value="blue">Bleu (#0097A7)</option>
                        <option value="cyan">Turquoise (#00BCD4)</option>
                      </select>
                    </div>
                  </div>

                  {genConfig.type === 'button' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Variété MD3</label>
                        <select 
                          value={genConfig.variant}
                          onChange={(e) => setGenConfig({...genConfig, variant: e.target.value})}
                          className={`w-full px-3 py-2 text-xs rounded-lg border cursor-pointer focus:outline-none ${
                            theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 text-slate-700' : 'bg-[#182030] border-slate-800'
                          }`}
                        >
                          <option value="filled">Filled (Plein)</option>
                          <option value="outlined">Outlined (Contour)</option>
                          <option value="tonal">Tonal (Flou)</option>
                          <option value="text">Juste Texte</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Taille</label>
                        <select 
                          value={genConfig.size}
                          onChange={(e) => setGenConfig({...genConfig, size: e.target.value})}
                          className={`w-full px-3 py-2 text-xs rounded-lg border cursor-pointer focus:outline-none ${
                            theme === 'light' ? 'bg-[#FFFFFF] border-slate-200 text-slate-700' : 'bg-[#182030] border-slate-800'
                          }`}
                        >
                          <option value="sm">Compact (sm)</option>
                          <option value="md">Standard (md)</option>
                          <option value="lg">Majestueux (lg)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Options visuelles</label>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={genConfig.icon}
                            onChange={(e) => setGenConfig({...genConfig, icon: e.target.checked})}
                            className="w-4 h-4 accent-[#0097A7]"
                          />
                          <span className="text-xs font-semibold">Icône d'action</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">Label du Composant</label>
                    <input 
                      type="text" 
                      value={genConfig.label}
                      onChange={(e) => setGenConfig({...genConfig, label: e.target.value})}
                      className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-sans focus:ring-1 focus:ring-[#0097A7] ${
                        theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#182030] border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  {/* Render simulated button inside component and let the user interact */}
                  <div className={`p-6 rounded-xl border border-dashed flex items-center justify-center transition-all ${
                    theme === 'light' ? 'bg-slate-50/60 border-slate-300' : 'bg-[#182030]/50 border-slate-800'
                  }`}>
                    <div className="text-center space-y-3">
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Rendu en Temps Réel</p>
                      <div>
                        {genConfig.type === 'button' ? (
                          <button 
                            className={`rounded-full transition duration-300 transform active:scale-95 flex items-center justify-center gap-2 tracking-wide font-sans cursor-pointer mx-auto ${
                              genConfig.size === 'sm' ? 'px-3.5 py-1.5 text-xs' : genConfig.size === 'lg' ? 'px-6.5 py-3.5 text-sm font-semibold' : 'px-5 py-2.5 text-xs font-medium'
                            } ${
                              genConfig.variant === 'filled'
                                ? genConfig.color === 'blue' ? 'bg-[#0097A7] text-white hover:bg-[#00838F] shadow-md' : 'bg-[#00BCD4] text-white hover:bg-[#00ACC1] shadow-md'
                                : genConfig.variant === 'outlined'
                                  ? `border border-${genConfig.color === 'blue' ? '[#0097A7]' : '[#00BCD4]'} text-${genConfig.color === 'blue' ? '[#0097A7]' : '[#00BCD4]'} hover:bg-cyan-500/10`
                                  : genConfig.variant === 'tonal'
                                    ? `bg-${genConfig.color === 'blue' ? '[#0097A7]' : '[#00BCD4]'}/10 text-${genConfig.color === 'blue' ? '[#0097A7]' : '[#00BCD4]'} hover:bg-opacity-20`
                                    : `text-${genConfig.color === 'blue' ? '[#0097A7]' : '[#00BCD4]'} hover:underline`
                            }`}
                          >
                            {genConfig.icon && <Plus className="w-4.5 h-4.5" />}
                            <span>{genConfig.label}</span>
                          </button>
                        ) : (
                          <div className="relative w-72 mx-auto text-left">
                            <input 
                              type="text" 
                              placeholder=" " 
                              className={`w-full px-4 pt-5 pb-1.5 text-xs rounded-lg border outline-none font-sans transition-all peer ${
                                theme === 'light' ? 'bg-white border-slate-300 focus:border-[#0097A7] text-slate-800' : 'bg-[#121826] border-slate-800 focus:border-[#00BCD4] text-white'
                              }`}
                            />
                            <label className="absolute left-4 top-1.5 transition-all text-[10px] font-bold text-[#0097A7] peer-placeholder-shown:text-xs peer-placeholder-shown:top-3.5 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#00BCD4] pointer-events-none">
                              {genConfig.label}
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Show TypeScript Production Ready code for the builder */}
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Code TSX / Tailwind Exportable</span>
                      <button 
                        onClick={() => handleCopyCode(getGeneratedComponentCode())}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#0097A7] hover:text-[#00BCD4] border border-transparent hover:border-[#00BCD4]/20 px-2 py-1 rounded bg-slate-950/20 transition cursor-pointer"
                      >
                        {copiedText ? (
                          <span className="text-emerald-500 font-sans">{copiedText}</span>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="text-[11px] font-mono bg-[#070a13] p-4 rounded-xl text-slate-200 overflow-x-auto border border-slate-850 h-56 custom-scrollbar leading-relaxed">
                      {getGeneratedComponentCode()}
                    </pre>
                  </div>

                  <div className={`p-4 rounded-xl border mt-4 text-xs ${theme === 'light' ? 'bg-[#F2F4F7]/40 border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    <div className="flex gap-2 items-start">
                      <Info className="w-4 h-4 text-[#00BCD4] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-700 dark:text-slate-300 font-semibold">Conseil d'implémentation :</strong>
                        <p className="leading-relaxed text-[11px]">Notre application s'appuie sur la fonte <strong>Space Grotesk</strong> pour les displays à fort impact et <strong>Inter</strong> pour les formulaires. Pour respecter le standard MD3, préférez l'attribut <code>tracking-wide</code> sur tous vos boutons d'action.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </main>
        </div>

      </div>

      {/* Interactive Modal / Dialog Component simulation using Motion */}
      <AnimatePresence>
        {isDialogOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Modal Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDialogOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            
            {/* Modal Dialog Surface */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`relative max-w-lg w-full p-6 rounded-3xl shadow-2xl border font-sans text-xs ${
                theme === 'light' 
                  ? 'bg-[#FFFFFF] border-slate-200 text-[#1F2937]' 
                  : 'bg-[#121826] border-slate-800 text-slate-100'
              }`}
            >
              {/* Close pin */}
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex gap-3 items-start pr-8">
                <span className="p-2 bg-[#00BCD4]/10 text-[#0097A7] rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-display font-bold text-[#0097A7]">Nouveau Dossier Réfraction</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">FORMULAIRE DE CRÉATION - DIRECTIVES MD3</p>
                </div>
              </div>

              {/* Form in dialog body */}
              <div className="mt-5 space-y-4">
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  La création d'un dossier patient requiert la saisie d'informations d'assurance médicale ainsi que d'une anamnèse visuelle. Toutes ces informations sont encryptées conformément au protocole RGPD d'ERP Optique.
                </p>

                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      defaultValue="Mme. Alice Bernard"
                      className={`w-full px-4 pt-5 pb-1.5 text-xs rounded-lg border outline-none font-sans ${theme === 'light' ? 'bg-white border-slate-250 text-slate-800' : 'bg-[#1b2335] border-slate-800 text-white'}`}
                      placeholder=" "
                    />
                    <label className="absolute left-4 top-1.5 text-[10px] font-bold text-[#0097A7]">Bénéficiaire de l'ordonnance</label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input 
                        type="text" 
                        defaultValue="ALB-94-PARIS"
                        className={`w-full px-4 pt-5 pb-1.5 text-xs rounded-lg border outline-none font-sans ${theme === 'light' ? 'bg-white border-slate-250' : 'bg-[#1b2335] border-slate-800'}`}
                        placeholder=" "
                      />
                      <label className="absolute left-4 top-1.5 text-[10px] font-bold text-slate-400">Numéro de Sécu</label>
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        defaultValue="MGEN / Paris I"
                        className={`w-full px-4 pt-5 pb-1.5 text-xs rounded-lg border outline-none font-sans ${theme === 'light' ? 'bg-white border-slate-250' : 'bg-[#1b2335] border-slate-800'}`}
                        placeholder=" "
                      />
                      <label className="absolute left-4 top-1.5 text-[10px] font-bold text-slate-400">Régime Complémentaire</label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-start p-3 bg-[#0097A7]/5 border border-[#0097A7]/10 rounded-xl">
                  <Info className="w-4.5 h-4.5 text-[#0097A7] shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                    <strong>Processus d’approbation :</strong> Les opticiens d'ateliers seront d'office assignés à cette fiche de réfraction pour l'évaluation biométrique.
                  </p>
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="mt-6 flex justify-end gap-2.5">
                <button 
                  onClick={() => setIsDialogOpen(false)}
                  className={`px-4 py-2 rounded-full font-medium transition cursor-pointer ${theme === 'light' ? 'text-slate-600 hover:bg-slate-150' : 'text-slate-400 hover:bg-slate-850'}`}
                >
                  Annuler l'opération
                </button>
                <button 
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-[#0097A7] hover:bg-[#00838F] text-white text-xs px-5 py-2 rounded-full font-semibold shadow-md active:scale-95 transition cursor-pointer"
                >
                  Enregistrer & Assigner Opticien
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Profile Drawer simulated container using Motion */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-100 flex justify-end">
            {/* Drawer Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
            />

            {/* Drawer Body Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={`relative w-80 h-full p-6 shadow-2xl border-l flex flex-col justify-between font-sans text-xs ${
                theme === 'light' 
                  ? 'bg-[#FFFFFF] border-slate-200 text-[#1F2937]' 
                  : 'bg-[#121826] border-slate-800 text-slate-100'
              }`}
            >
              <div>
                
                {/* Close Drawer Button */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-mono tracking-widest font-bold text-slate-400">FICHE COLLABORATEUR</span>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Profile header visual */}
                <div className="text-center space-y-3 mb-6">
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#0097A7] to-[#00BCD4] text-white font-bold text-xl flex items-center justify-center shadow-lg mx-auto">
                    A
                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center"></span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Alexandre GLABTECH</h3>
                    <p className="text-[10px] text-[#00BCD4] font-medium font-mono">ID: MON-7819</p>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  {/* Scope permissions listing inside drawer */}
                  <div>
                    <span className="block text-[10.5px] font-semibold text-slate-400 uppercase font-mono tracking-wider mb-2">Habilitations Active (RBAC)</span>
                    <div className="space-y-1">
                      <div className="flex gap-2 items-center px-2.5 py-1.5 rounded-lg bg-[#00BCD4]/10 text-cyan-700 dark:text-cyan-300">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Rôle : {formFields.userRole}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-2.5 rounded-lg text-[10.5px] space-y-1 font-mono text-slate-500">
                        <div>✔ branches_write_self</div>
                        <div>✔ prescriptions:read</div>
                        <div>✔ orders_validate_stock</div>
                        <div>✔ audit_read_financial</div>
                      </div>
                    </div>
                  </div>

                  {/* Active session context */}
                  <div className="pt-4 border-t border-slate-200/50 dark:border-slate-850/50 space-y-2">
                    <span className="block text-[10.5px] font-semibold text-slate-400 uppercase font-mono tracking-wider">Session Active</span>
                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <div>IP Connexion: <span className="font-mono">192.168.1.55</span></div>
                      <div>Navigateur: <span className="font-mono">Chrome / macOS</span></div>
                      <div>Dernier rafraîchissement: <span className="font-mono">Il y a 14s</span></div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Drawer option footer */}
              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-850/50 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Jetons JWT MFA verifies</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-2 bg-gradient-to-r from-[#0097A7] to-[#00BCD4] text-white text-xs font-bold font-sans uppercase rounded-xl shadow cursor-pointer text-center hover:opacity-90 active:scale-95 transition"
                >
                  DECONNEXION DU TERMINAL
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
