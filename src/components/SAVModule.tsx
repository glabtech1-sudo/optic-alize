import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Sliders, RefreshCw, Send, Plus, Search, 
  Terminal, Play, Clock, AlertTriangle, HelpCircle,
  Download, Mail, MessageSquare, Phone, Calendar, Printer, Building
} from 'lucide-react';

interface SAVModuleProps {
  currentLanguage: 'FR' | 'EN';
  currentCompany: {
    id: string;
    name: string;
    currency: string;
    taxRate: number;
    symbol: string;
  };
  isOffline: boolean;
  customers?: any[];
}

export default function SAVModule({ currentLanguage, currentCompany, isOffline, customers }: SAVModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'savWarranties' | 'apiPlayground' | 'pushConsole'>('savWarranties');

  // Load customers from props, or read from localStorage
  const crmCustomers = React.useMemo(() => {
    if (customers && customers.length > 0) return customers;
    const saved = localStorage.getItem('optic_crm_customers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  }, [customers]);

  // SAV & Warranties States
  const [searchSku, setSearchSku] = useState('RAY-WAYF-302');
  const [warrantyResult, setWarrantyResult] = useState<any | null>({
    sku: 'RAY-WAYF-302',
    name: 'Ray-Ban Wayfarer Classic Black',
    status: 'Sous Garantie',
    expirationDate: '2027-12-15',
    daysLeft: 540,
    coverage: 'Casse accidentelle, fissure verres, vice de construction d\'usine.'
  });

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [savSearchQuery, setSavSearchQuery] = useState<string>('');

  // Initial claims augmented with contact details and branch
  const [savClaims, setSavClaims] = useState<any[]>(() => {
    const saved = localStorage.getItem('optic_sav_claims');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  React.useEffect(() => {
    localStorage.setItem('optic_sav_claims', JSON.stringify(savClaims));
  }, [savClaims]);

  const [claimClient, setClaimClient] = useState('');
  const [claimSku, setClaimSku] = useState('CHAN-PRES-007');
  const [claimIssue, setClaimIssue] = useState('');
  
  const [agencies, setAgencies] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('optic_hq_branches');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [
      { id: 'Paris Nation', name: 'Paris Nation' },
      { id: 'Bordeaux Centre', name: 'Bordeaux Centre' },
      { id: 'Marseille Vieux-Port', name: 'Marseille Vieux-Port' },
      { id: 'Dakar Fann', name: 'Dakar Fann' }
    ];
  });

  const [claimBranch, setClaimBranch] = useState(() => {
    try {
      const saved = localStorage.getItem('optic_hq_branches');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].name;
      }
    } catch (e) {}
    return '';
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('optic_hq_branches');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setAgencies(parsed);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [claimPhone, setClaimPhone] = useState('');
  const [claimEmail, setClaimEmail] = useState('');

  // Info message state
  const [communicationModal, setCommunicationModal] = useState<{
    clientName: string;
    type: 'SMS' | 'Email' | 'WhatsApp';
    destination: string;
    isOpen: boolean;
  } | null>(null);

  const [savToast, setSavToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setSavToast(msg);
    setTimeout(() => setSavToast(null), 3000);
  };

  // API REST Playground State
  const [activeEndpoint, setActiveEndpoint] = useState<string>('/api/v1/warranties');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiResponseJson, setApiResponseJson] = useState<string>('// Cliquez sur "Tester la Requête" pour voir le retour JSON\n// de l\'API Rest du point d\'accès de garantie.');
  const [apiIsLoading, setApiIsLoading] = useState(false);

  // Push notifications state
  const [pushTitle, setPushTitle] = useState('Alerte Atelier G-LAB');
  const [pushBody, setPushBody] = useState('Votre monture de lunettes personnalisée est prête à être récupérée en boutique.');
  const [pushTarget, setPushTarget] = useState('ALL');
  const [pushLogs, setPushLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('optic_push_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  React.useEffect(() => {
    localStorage.setItem('optic_push_logs', JSON.stringify(pushLogs));
  }, [pushLogs]);

  // Handle SKU warranty verification
  const handleVerifyWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSku) return;

    const skuDb: Record<string, any> = {
      'RAY-WAYF-302': {
        sku: 'RAY-WAYF-302',
        name: 'Ray-Ban Wayfarer Classic Black',
        status: 'Sous Garantie',
        expirationDate: '2027-12-15',
        daysLeft: 540,
        coverage: 'Casse accidentelle, fissure monture acétate.'
      },
      'OAK-HOLB-901': {
        sku: 'OAK-HOLB-901',
        name: 'Oakley Holbrook Polarized',
        status: 'Sous Garantie',
        expirationDate: '2026-11-20',
        daysLeft: 180,
        coverage: 'Revetement anti-rayure Iridium décollé, pièce détachée.'
      },
      'CHAN-PRES-007': {
        sku: 'CHAN-PRES-007',
        name: 'Chanel Prestige Glamour Fit',
        status: 'Hors Garantie',
        expirationDate: '2025-02-14',
        daysLeft: 0,
        coverage: 'Garantie échue après 24 mois d\'activité.'
      }
    };

    if (skuDb[searchSku]) {
      setWarrantyResult(skuDb[searchSku]);
    } else {
      setWarrantyResult({
        sku: searchSku,
        name: 'Référence temporaire ou non-répertoriée',
        status: 'Donnée de garantie manquante (Vente Directe Rapide)',
        expirationDate: 'Non-disponible',
        daysLeft: 0,
        coverage: 'Veuillez vérifier la facture d\'achat papier ERP.'
      });
    }
  };

  // Open claim ticket
  const handleOpenClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimClient || !claimIssue) return;

    let warType = 'Hors Garantie';
    if (claimSku === 'OAK-HOLB-901' || claimSku === 'RAY-WAYF-302') {
      warType = 'Sous Garantie';
    }

    const newClaim = {
      id: `SAV-${Math.floor(900 + Math.random() * 100)}`,
      clientName: claimClient,
      frameSku: claimSku,
      issue: claimIssue,
      status: 'Reçu',
      date: new Date().toISOString().split('T')[0],
      warrantyStatus: warType,
      branch: claimBranch,
      phone: claimPhone || '06 00 00 00 00',
      email: claimEmail || 'client@opticalize.fr'
    };

    setSavClaims([newClaim, ...savClaims]);
    setClaimClient('');
    setClaimIssue('');
    setClaimPhone('');
    setClaimEmail('');
    triggerToast(currentLanguage === 'FR' ? "Ticket S.A.V enregistré !" : "S.A.V ticket registered successfully!");
  };

  const updateClaimStatus = (id: string, newStatus: string) => {
    setSavClaims(savClaims.map(c => c.id === id ? { ...c, status: newStatus } : c));
    triggerToast(currentLanguage === 'FR' ? `Statut mis à jour : ${newStatus}` : `Status updated: ${newStatus}`);
  };

  // API rest simulation
  const handleTestApi = () => {
    setApiIsLoading(true);
    setApiResponseJson('// Chargement du payload de la base de données PostgreSQL...\n// Exécution du middleware de routage REST...');
    
    setTimeout(() => {
      setApiIsLoading(false);
      let outputObj: any = {};
      
      if (activeEndpoint === '/api/v1/warranties') {
        outputObj = {
          status: "success",
          timestamp: new Date().toISOString(),
          requestedSku: searchSku,
          resolvedWarranty: warrantyResult || {
            sku: searchSku,
            status: "Inconnu",
            coverage: "Vérifier la caisse physique"
          }
        };
      } else {
        outputObj = {
          status: "success",
          timestamp: new Date().toISOString(),
          endpoint: activeEndpoint,
          data: savClaims
        };
      }
      
      setApiResponseJson(JSON.stringify(outputObj, null, 2));
    }, 850);
  };

  // Send push SMS notification
  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushBody) return;

    const newLog = {
      id: `PUSH-${Math.floor(100 + Math.random() * 900)}`,
      title: pushTitle,
      body: pushBody,
      target: pushTarget,
      status: 'Délivré ✓',
      time: new Date().toTimeString().split(' ')[0]
    };

    setPushLogs([newLog, ...pushLogs]);
    setPushTitle('');
    setPushBody('');
  };

  // filteredClaims computed based on selectedBranch, startDate, endDate, and savSearchQuery
  const filteredClaims = React.useMemo(() => {
    return savClaims.filter(claim => {
      // Branch filter
      if (selectedBranch !== 'All' && claim.branch !== selectedBranch) {
        return false;
      }
      
      // Date range filter
      if (startDate && claim.date < startDate) {
        return false;
      }
      if (endDate && claim.date > endDate) {
        return false;
      }
      
      // Search query filter (clientName or frameSku or id)
      if (savSearchQuery) {
        const query = savSearchQuery.toLowerCase();
        const matchesName = claim.clientName.toLowerCase().includes(query);
        const matchesSku = claim.frameSku.toLowerCase().includes(query);
        const matchesId = claim.id.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesId) {
          return false;
        }
      }
      
      return true;
    });
  }, [savClaims, selectedBranch, startDate, endDate, savSearchQuery]);

  // Open communication dialog
  const openCommunication = (clientName: string, type: 'SMS' | 'Email' | 'WhatsApp', destination: string) => {
    setCommunicationModal({
      clientName,
      type,
      destination,
      isOpen: true
    });
  };

  // Send message simulation
  const handleSendMockMessage = (messageText: string) => {
    setCommunicationModal(null);
    triggerToast(
      currentLanguage === 'FR'
        ? `Message envoyé à l'adresse/numéro !`
        : `Message sent to address/number successfully!`
    );
  };

  // Excel CSV Export
  const handleExportSAVExcel = () => {
    try {
      const headers = ['ID', 'Client', 'SKU Monture', 'Problematique', 'Statut', 'Date', 'Garantie', 'Agence', 'Telephone', 'Email'];
      const rows = filteredClaims.map(c => [
        c.id, c.clientName, c.frameSku, c.issue, c.status, c.date, c.warrantyStatus, c.branch, c.phone, c.email
      ]);
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sav_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerToast(currentLanguage === 'FR' ? "Export Excel (.csv) réussi !" : "Excel CSV Export succeeded!");
    } catch (e) {
      console.error(e);
      triggerToast("Failed to export Excel CSV");
    }
  };

  // PDF Print Report
  const handlePrintSAVPdf = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const claimsRowsHtml = filteredClaims.map(c => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px; font-weight: bold;">${c.id}</td>
          <td style="padding: 10px;">${c.clientName}</td>
          <td style="padding: 10px;">${c.branch}</td>
          <td style="padding: 10px;">${c.date}</td>
          <td style="padding: 10px; font-family: monospace;">${c.frameSku}</td>
          <td style="padding: 10px;">${c.issue}</td>
          <td style="padding: 10px;">${c.warrantyStatus}</td>
          <td style="padding: 10px; font-weight: bold; color: #0097A7;">${c.status}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Rapport d'Atelier S.A.V. - Optic Alizé</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f1f5f9; text-align: left; padding: 12px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
              h1 { font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 5px; }
              hr { border: 0; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div>
              <h1>RAPPORT D'ATELIER OPTIC ALIZÉ - S.A.V.</h1>
              <p style="font-size: 11px; color: #64748b; margin: 0;">Généré le ${new Date().toLocaleDateString()} • Agence : ${selectedBranch === 'All' ? 'Toutes les Boutiques / Agences' : selectedBranch}</p>
            </div>
            <hr style="margin-top: 20px; margin-bottom: 25px;" />
            
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Boutique</th>
                  <th>Date Entrée</th>
                  <th>Code Monture SKU</th>
                  <th>Anomalie</th>
                  <th>Garantie</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${claimsRowsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 50px; text-align: right; font-size: 11px; color: #64748b;">
              <p>Signature Responsable d'Atelier : _______________________</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      triggerToast(currentLanguage === 'FR' ? "Rapport PDF imprimé avec succès !" : "Print PDF report generated successfully!");
    } else {
      triggerToast(currentLanguage === 'FR' ? "Autorisez les fenêtres pop-up pour l'impression" : "Please allow popup windows for printing");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Block */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span>{currentLanguage === 'FR' ? 'Service Après-Vente & Garanties (S.A.V.)' : 'After-Sales & Warranties'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {currentLanguage === 'FR' 
              ? 'Vérification de validité de garantie constructeur, réparation de montures, suivi d\'atelier mécanique et fiches de panne.' 
              : 'Frame warranty checkups, repair claims, material damage logs, and workshop status tracking.'}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('savWarranties')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'savWarranties' 
                ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' 
                : 'text-slate-550 hover:text-slate-950'
            }`}
          >
            {currentLanguage === 'FR' ? 'Réparations & Garanties' : 'Repairs & Coverage'}
          </button>
          <button
            onClick={() => setActiveSubTab('apiPlayground')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'apiPlayground' 
                ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' 
                : 'text-slate-550 hover:text-slate-950'
            }`}
          >
            API REST
          </button>
          <button
            onClick={() => setActiveSubTab('pushConsole')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'pushConsole' 
                ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' 
                : 'text-slate-550 hover:text-slate-950'
            }`}
          >
            {currentLanguage === 'FR' ? 'Notifications Client' : 'Client Alerts'}
          </button>
        </div>
      </div>

      {activeSubTab === 'savWarranties' && (
        <div className="space-y-6">
          
          {/* Advanced Filtering Frame */}
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs font-sans shadow-3xs text-left">
            {/* 1. Agency Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3 h-3 text-[#0097A7]" />
                {currentLanguage === 'FR' ? 'Agence / Boutique' : 'Store Branch'}
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full text-xs font-bold p-2 bg-white rounded-lg border border-slate-200 cursor-pointer text-slate-800"
              >
                <option value="All">{currentLanguage === 'FR' ? 'Toutes les Agences d\'Atelier' : 'All Workshop Branches'}</option>
                <option value="Paris Nation">Paris Nation</option>
                <option value="Bordeaux Centre">Bordeaux Centre</option>
                <option value="Marseille Vieux-Port">Marseille Vieux-Port</option>
                <option value="Dakar Fann">Dakar Fann</option>
              </select>
            </div>

            {/* 2. Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-indigo-500" />
                {currentLanguage === 'FR' ? 'Date de Début (Calendrier)' : 'Start Date Calendar'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-bold p-1.5 bg-white rounded-lg border border-slate-200 text-slate-700 font-mono"
              />
            </div>

            {/* 3. End Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-rose-500" />
                {currentLanguage === 'FR' ? 'Date de Fin (Calendrier)' : 'End Date Calendar'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs font-bold p-1.5 bg-white rounded-lg border border-slate-200 text-slate-700 font-mono"
              />
            </div>

            {/* 4. Search text */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3 h-3 text-slate-400" />
                {currentLanguage === 'FR' ? 'Rechercher Patient / SKU' : 'Search Patient / SKU'}
              </label>
              <input
                type="text"
                placeholder={currentLanguage === 'FR' ? 'Nom ou SKU monture...' : 'Search name or frame...'}
                value={savSearchQuery}
                onChange={(e) => setSavSearchQuery(e.target.value)}
                className="w-full text-xs p-2 bg-white rounded-lg border border-slate-200 focus:outline-[#0097A7] font-semibold text-slate-850"
              />
            </div>
          </div>

          {/* Export and Status Indicators bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-[#0097A7]/20 rounded-xl shadow-4xs">
            <div className="text-xs text-slate-500 font-medium">
              📊 {currentLanguage === 'FR' ? 'Résultats d\'atelier :' : 'Workshop items :'} <strong className="text-[#0097A7] font-mono text-sm">{filteredClaims.length}</strong> {currentLanguage === 'FR' ? 'tickets filtrés' : 'filtered tickets'}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSAVExcel}
                className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 border border-emerald-200 cursor-pointer shadow-3xs"
                title={currentLanguage === 'FR' ? 'Exporter en format Excel (.csv)' : 'Export to Excel (.csv)'}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>

              <button
                onClick={handlePrintSAVPdf}
                className="px-3 py-2 bg-[#0097A7]/10 text-[#00838F] hover:bg-[#0097A7]/20 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 border border-[#0097A7]/30 cursor-pointer shadow-3xs"
                title={currentLanguage === 'FR' ? 'Générer rapport imprimable PDF' : 'Generate printable PDF report'}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF / Imprimer</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Warranty check & open ticket forms */}
            <div className="lg:col-span-5 space-y-5">
              
              <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-3xs space-y-4 text-xs">
                <h3 className="text-sm font-black text-slate-855 border-b border-slate-100 pb-2">
                  🛡 Vérification de Garantie
                </h3>

                <form onSubmit={handleVerifyWarranty} className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Entrez le code SKU d'une monture pour vérifier l'admissibilité de prise en charge :
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={searchSku}
                      onChange={(e) => setSearchSku(e.target.value)}
                      placeholder="e.g. RAY-WAYF-302"
                      className="flex-1 text-xs p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-501 bg-slate-55 border border-slate-200 font-mono font-bold"
                    />
                    <button 
                      type="submit"
                      className="px-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition"
                    >
                      Vérifier
                    </button>
                  </div>
                </form>

                {warrantyResult && (
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-800 text-xs">{warrantyResult.name}</strong>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                        warrantyResult.status === 'Sous Garantie' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {warrantyResult.status}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-400 font-mono text-[9px]">SKU: {warrantyResult.sku}</p>
                    
                    {warrantyResult.status === 'Sous Garantie' && (
                      <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-[11px] leading-relaxed">
                        <span>📆 Securisé jusqu'au : <strong>{warrantyResult.expirationDate}</strong> ({warrantyResult.daysLeft} jours restants)</span><br/>
                        <span className="block mt-1 font-medium">🛡 Couverture : {warrantyResult.coverage}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Create new Maintenance block */}
              <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-3xs space-y-4 text-xs text-left">
                <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2">
                  🛠 Enregistrer un retour S.A.V.
                </h3>

                <form onSubmit={handleOpenClaim} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Patient (Registre Client CRM)</label>
                      <select 
                        value={crmCustomers.find(c => `${c.firstName} ${c.lastName}` === claimClient)?.id || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const found = crmCustomers.find(c => c.id === selectedId);
                          if (found) {
                            setClaimClient(`${found.firstName} ${found.lastName}`);
                            setClaimPhone(found.phone || '');
                            setClaimEmail(found.email || '');
                          } else {
                            setClaimClient('');
                            setClaimPhone('');
                            setClaimEmail('');
                          }
                        }}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-1 focus:ring-[#0097A7] focus:outline-none"
                        required
                      >
                        <option value="">-- {currentLanguage === 'FR' ? 'Choisir du Registre...' : 'Select from Registry...'} --</option>
                        {crmCustomers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.firstName} {c.lastName.toUpperCase()} ({c.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Agence</label>
                      <select 
                        value={claimBranch}
                        onChange={(e) => setClaimBranch(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        {agencies.map((agency) => (
                          <option key={agency.id || agency.name} value={agency.name}>
                            {agency.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro Téléphone</label>
                      <input 
                        type="text" 
                        value={claimPhone}
                        onChange={(e) => setClaimPhone(e.target.value)}
                        placeholder="Ex: 06 12 45 78 90"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse Courriel (Email)</label>
                      <input 
                        type="email" 
                        value={claimEmail}
                        onChange={(e) => setClaimEmail(e.target.value)}
                        placeholder="Ex: client@gmail.com"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Monture à réparer</label>
                    <select 
                      value={claimSku} 
                      onChange={(e) => setClaimSku(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="RAY-WAYF-302">Ray-Ban Wayfarer Classic Black</option>
                      <option value="OAK-HOLB-901">Oakley Holbrook Polarized</option>
                      <option value="CHAN-PRES-007">Chanel Prestige Glamour Fit</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Description de la casse</label>
                    <input 
                      type="text" 
                      value={claimIssue}
                      onChange={(e) => setClaimIssue(e.target.value)}
                      placeholder="Ex: Charnière gauche arrachée"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#0097A7] hover:bg-[#00838F] text-white font-[#0097A7] font-extrabold text-xs rounded-xl"
                  >
                    Ouvrir Dossier Réparation
                  </button>
                </form>
              </div>

            </div>

            {/* Repairs list tab */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider text-left">
                Atelier S.A.V. - Avancement des Réparations en cours
              </h3>

              <div className="space-y-3.5 pr-1 text-left">
                {filteredClaims.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed">
                    Aucun dossier S.A.V ne correspond aux filtres appliqués (Agence ou Période).
                  </div>
                ) : (
                  filteredClaims.map((claim) => (
                    <div 
                      key={claim.id} 
                      className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs shadow-2xs hover:border-[#0097A7]/40 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {/* CHAT/SMS/EMAIL ACTIONS LIST */}
                          <span className="flex gap-1 bg-white border p-0.5 rounded shadow-2xs select-none">
                            <button
                              onClick={() => openCommunication(claim.clientName, 'SMS', claim.phone)}
                              className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition cursor-pointer"
                              title="Envoyer un SMS"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openCommunication(claim.clientName, 'Email', claim.email)}
                              className="p-1 hover:bg-blue-50 text-blue-500 rounded transition cursor-pointer"
                              title="Envoyer un Mail"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openCommunication(claim.clientName, 'WhatsApp', claim.phone)}
                              className="p-1 hover:bg-green-50 text-green-500 rounded transition cursor-pointer"
                              title="Engager discussion WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          </span>

                          <strong className="text-slate-800 text-xs font-black">{claim.clientName}</strong>
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 rounded">{claim.id}</span>
                          <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1 rounded uppercase tracking-wider">{claim.branch}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 rounded ${
                            claim.warrantyStatus === 'Sous Garantie' ? 'bg-emerald-50 text-emerald-705 border border-emerald-100' : 'bg-red-50 text-red-705 border border-red-100'
                          }`}>
                            {claim.warrantyStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic">Code monture : <strong>{claim.frameSku}</strong> (Créé: <span className="font-mono">{claim.date}</span>)</p>
                        <p className="text-slate-800 font-bold mt-1">💔 Anomalie : <span className="text-slate-550 font-medium">"{claim.issue}"</span></p>
                        <p className="text-[10px] text-slate-400">📬 Contacts : <span className="font-mono text-slate-600">{claim.phone}</span> • <span className="text-slate-650 font-mono">{claim.email}</span></p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                          claim.status === 'Livré' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : claim.status === 'Réparé' 
                            ? 'bg-blue-105 text-blue-800' 
                            : claim.status === 'En Atelier' 
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {claim.status}
                        </span>

                        {claim.status !== 'Livré' && (
                          <div className="flex gap-1 font-bold">
                            {claim.status === 'Reçu' && (
                              <button onClick={() => updateClaimStatus(claim.id, 'En Atelier')} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] rounded hover:bg-amber-100 transition cursor-pointer font-bold border border-amber-100">Atelier</button>
                            )}
                            {claim.status === 'En Atelier' && (
                              <button onClick={() => updateClaimStatus(claim.id, 'Réparé')} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] rounded hover:bg-blue-100 transition cursor-pointer font-bold border border-blue-100">Réparé</button>
                            )}
                            {claim.status === 'Réparé' && (
                              <button onClick={() => updateClaimStatus(claim.id, 'Livré')} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] rounded hover:bg-emerald-100 transition cursor-pointer font-bold border border-emerald-100">Livrer</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Interactive messaging Overlay modal */}
          <AnimatePresence>
            {communicationModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-slate-900 relative space-y-4 text-left"
                >
                  <button
                    onClick={() => setCommunicationModal(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                  >
                    &times;
                  </button>

                  <div className="flex items-center gap-3 border-b pb-3 border-slate-100">
                    <span className="p-3 bg-[#E0F7FA] text-[#0097A7] rounded-full">
                      {communicationModal.type === 'SMS' && <MessageSquare className="w-5 h-5" />}
                      {communicationModal.type === 'Email' && <Mail className="w-5 h-5" />}
                      {communicationModal.type === 'WhatsApp' && <Phone className="w-5 h-5" />}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-850">
                        {currentLanguage === 'FR' ? `Rédiger un ${communicationModal.type}` : `Draft ${communicationModal.type}`}
                      </h3>
                      <p className="text-[10px] text-slate-505 font-semibold font-mono">
                        Destinataire : <strong className="text-[#0097A7]">{communicationModal.destination}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <p className="text-xs text-slate-500">
                      Un gabarit pré-rempli a été automatiquement formaté avec l'état d'avancement S.A.V. :
                    </p>

                    <div className="p-3.5 bg-slate-50 rounded-xl border font-mono text-[11px] text-slate-700 leading-relaxed font-bold">
                      {communicationModal.type === 'SMS' && `[Optic Alizé] Bonjour ${communicationModal.clientName}, votre équipement optique S.A.V. est prêt à l'atelier Paris Nation. Merci de votre confiance !`}
                      {communicationModal.type === 'WhatsApp' && `🟢 [Optic Alizé] Bonjour ${communicationModal.clientName} ! Votre dossier S.A.V est mis à jour. Nos opticiens ont validé votre garantie de monture.`}
                      {communicationModal.type === 'Email' && `Objet: Suivi réparation S.A.V — Votre dossier Optic Alizé\n\nChère client(e) ${communicationModal.clientName},\n\nNous vous informons de la bonne réparation de votre pièce d'optique dans notre laboratoire unifié.\n\nCordialement,\nL'Atelier Optic Alizé`}
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                      <button
                        onClick={() => setCommunicationModal(null)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer transition"
                      >
                        {currentLanguage === 'FR' ? 'Annuler' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => handleSendMockMessage(`Simulation: message ${communicationModal.type} envoyé`)}
                        className="px-[#0097A7]/90 px-4 py-2 bg-[#0097A7] text-white font-extrabold rounded-xl text-xs hover:bg-[#00838F] cursor-pointer shadow-sm transition"
                      >
                        {currentLanguage === 'FR' ? 'Envoyer Message 🚀' : 'Send Message 🚀'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Simple temporary SAV alert toast notifications */}
          {savToast && (
            <div className="fixed bottom-6 right-6 p-4 bg-slate-905 text-white text-xs font-bold rounded-xl shadow-xl z-50 flex items-center gap-2 animate-fade-in border border-slate-700">
              <span className="p-1 bg-emerald-500 rounded-full shrink-0">✓</span>
              <span>{savToast}</span>
            </div>
          )}

        </div>
      )}

      {/* API Rest tab */}
      {activeSubTab === 'apiPlayground' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-105 text-indigo-705 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span>Interactive REST documentation (Simulation API JSON d'Atelier de Réparations)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Endpoints actifs</h4>
              
              <div className="space-y-2">
                {[
                  { path: '/api/v1/warranties', method: 'GET', desc: 'Vérifier la validité constructeur d\'un produit d\'optométrie.' },
                  { path: '/api/v1/sav-repairs', method: 'GET', desc: 'Suivre l\'avancement d\'atelier de toutes les réparations.' }
                ].map((ep) => {
                  const isSelected = activeEndpoint === ep.path;
                  return (
                    <div 
                      key={ep.path}
                      onClick={() => setActiveEndpoint(ep.path)}
                      className={`p-3 border rounded-xl cursor-pointer transition text-left ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700' 
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white font-mono text-[9px] font-bold">
                          {ep.method}
                        </span>
                        <span className="text-xs font-bold font-mono">{ep.path}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{ep.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                <button
                  onClick={handleTestApi}
                  disabled={apiIsLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  {apiIsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>Lancer l'Appel API</span>
                </button>
              </div>
            </div>

            {/* JSON Output console */}
            <div className="lg:col-span-7 space-y-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Réponse JSON d'Atelier</span>
              <div className="bg-[#1e293b] text-[#f1f5f9] p-4 rounded-xl font-mono text-xs h-80 overflow-y-auto shadow-sm border border-slate-900">
                <pre>{apiResponseJson}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Push log tab */}
      {activeSubTab === 'pushConsole' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2">
              📣 Diffuser une Alerte Push / SMS S.A.V.
            </h3>

            <form onSubmit={handleSendPush} className="space-y-3 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Segment Cible</label>
                <select 
                  value={pushTarget} 
                  onChange={(e) => setPushTarget(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="ALL">Tous les patients concernés</option>
                  <option value="OPTICIANS">Équipe Opticiens Réparateurs</option>
                  <option value="PATIENTS">Acheteurs S.A.V. (SMS Réparation Prête)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Titre du Message</label>
                <input 
                  type="text" 
                  value={pushTitle} 
                  onChange={(e) => setPushTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200" 
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Contenu SMS / Alerte mobile</label>
                <textarea 
                  value={pushBody} 
                  onChange={(e) => setPushBody(e.target.value)}
                  rows={3} 
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Envoyer la Notification
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Registre d'alertes push émises (Firebase Cloud Messaging)
            </h3>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {pushLogs.map((log) => (
                <div key={log.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-800">{log.title}</strong>
                      <span className="text-[9px] font-mono bg-slate-150 text-slate-650 px-1 rounded font-bold">{log.id}</span>
                      <span className="text-[9px] text-slate-400 font-bold">Cible: {log.target}</span>
                    </div>
                    <p className="text-[11px] text-slate-650 italic leading-relaxed mt-1">"{log.body}"</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-slate-400 font-mono">{log.time}</p>
                    <span className="text-[8px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 uppercase tracking-widest">{log.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
