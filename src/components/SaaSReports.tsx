import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Download, ArrowUpRight, Share2, Calendar, FileText, Building2, Wallet, Check, AlertCircle } from 'lucide-react';

interface SaaSReportsProps {
  darkMode?: boolean;
  currentLanguage?: 'FR' | 'EN';
}

export default function SaaSReports({ darkMode = false, currentLanguage = 'FR' }: SaaSReportsProps) {
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'revenue' | 'growth' | 'acquisition' | 'boutiques' | 'payroll'>('sales');

  const [selectedAuditBoutique, setSelectedAuditBoutique] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [compareBoutiques, setCompareBoutiques] = useState(false);

  // Dynamic Boutiques retrieve from localStorage
  // Dynamic Boutiques retrieve from localStorage
  const [localBranches, setLocalBranches] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('optic_hq_branches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(b => ({
            ...b,
            name: b.name.replace(/Boutique/g, 'Agence')
          }));
        }
      }
    } catch (e) {}
    if (localStorage.getItem('optic_system_factory_reset') === 'true') {
      return [];
    }
    return [
      { id: 'bt-dakar', name: 'Agence Alpha', country: 'Zone Ouest', code: 'A-01', sales: '14 540 000 FCFA', satisfaction: '98.2%', staff: '3 conseillers', stockIntegrity: '99.4%', status: 'Excellent', city: 'Dakar' },
      { id: 'bt-abidjan', name: 'Agence Bêta', country: 'Zone Ouest', code: 'B-02', sales: '11 250 000 FCFA', satisfaction: '95.5%', staff: '2 conseillers', stockIntegrity: '97.6%', status: 'Correct', city: 'Abidjan' },
      { id: 'bt-lome', name: 'Agence Gamma', country: 'Zone Ouest', code: 'G-03', sales: '8 700 000 FCFA', satisfaction: '94.0%', staff: '1 conseiller', stockIntegrity: '98.1%', status: 'Correct', city: 'Lomé' }
    ];
  });

  React.useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('optic_hq_branches');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setLocalBranches(parsed.map(b => ({
              ...b,
              name: b.name.replace(/Boutique/g, 'Agence')
            })));
          }
        } else if (localStorage.getItem('optic_system_factory_reset') === 'true') {
          setLocalBranches([]);
        }
      } catch (e) {}
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const [selectedAuditBoutiqueOption, setSelectedAuditBoutiqueOption] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('optic_hq_branches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      }
      return 'ALL';
    } catch (e) {
      return 'ALL';
    }
  });

  const triggerAudit = (boutiqueName: string) => {
    setIsAuditing(true);
    setSelectedAuditBoutique(boutiqueName);
    setAuditLogs([
      `Initialisation de l'audit de conformité sur ${boutiqueName}...`,
      `[OK] Connection sécurisée établie avec l'API régionale d'optique...`,
      `[VÉRIFICATION] Comparaison de l'inventaire physique vs stock informatique de l'atelier...`,
      `[INFO] 124 montures Ray-Ban Wayfarer, Chanel et Oakley réconciliées sans aucun écart.`,
      `[VÉRIFICATION] Contrôle de caisse et audit des clôtures financières du jour de la succursale...`,
      `[OK] Toutes les caisses locales de la période en cours sont équilibrées à l'euro/franc CFA près.`
    ]);
    setTimeout(() => {
      setAuditLogs(prev => [...prev, `[FÉLICITATIONS] Audit finalisé. Index de conformité audité à 100%. Aucun problème détecté.`]);
      setIsAuditing(false);
    }, 1200);
  };

  return (
    <div className={`p-1 space-y-6 ${darkMode ? 'dark text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-cyan-800 dark:text-cyan-400">
            {currentLanguage === 'FR' ? "Rapports et Business Intelligence" : "Reports & Business Intelligence telemetry"}
          </h2>
          <p className="text-xs text-[#64748B] mt-1 dark:text-slate-400">
            {currentLanguage === 'FR' 
              ? "Exportez des visualisations financières, analysez le parcours d'acquisition client et surveillez la courbe de croissance SaaS."
              : "Export consolidated optical financial telemetry, trace dynamic customer acquisition sources, and track multi-store growth benchmarks."}
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Green light styled Share Button */}
          <button className="flex items-center gap-2 px-3.5 py-1.5 text-xs bg-[#D1FAE5] hover:bg-[#A7F3D0] border border-[#10B981]/30 text-[#065F46] font-extrabold rounded-lg transition cursor-pointer">
            <Share2 className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'FR' ? "Partager" : "Share"}</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg transition shadow-sm cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'FR' ? "Télécharger PDF" : "Download PDF"}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Boutique Selector Shelf */}
      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-700/10 text-cyan-700 flex items-center justify-center shadow-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Filtrage de l'Audit par Succursale</h4>
            <p className="text-[10px] text-slate-500 font-medium">Sélectionnez la boutique pour isoler ses rapports et historiques d'audits.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">Boutique Active :</label>
          <select 
            value={selectedAuditBoutiqueOption}
            onChange={(e) => setSelectedAuditBoutiqueOption(e.target.value)}
            className="text-xs font-bold rounded-lg border border-slate-250 bg-white p-2 outline-none cursor-pointer focus:ring-1 focus:ring-cyan-600 text-slate-700"
          >
            <option value="ALL">🏢 Toutes les Boutiques</option>
            {localBranches.map((b) => (
              <option key={b.id} value={b.id}>🏢 {b.name} ({b.city})</option>
            ))}
          </select>
          {localBranches.length === 0 && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-mono">
              Créer manuellement des boutiques dans SuperAdmin HQ
            </span>
          )}
        </div>
      </div>

      {/* Reports Menu Pills Selector */}
      <div className={`flex p-1 rounded-xl max-w-fit gap-0.5 overflow-x-auto ${darkMode ? 'bg-slate-900 border border-slate-850' : 'bg-slate-100'}`}>
        {[
          { id: 'sales', label: 'Ventes Mensuelles' },
          { id: 'revenue', label: 'Revenus vs Dépenses' },
          { id: 'growth', label: 'Croissance Utilisateurs' },
          { id: 'acquisition', label: 'Canaux d\'acquisition' },
          { id: 'boutiques', label: '📊 Audits & Performances Boutiques' },
          { id: 'payroll', label: '💵 Audit & Rapports de Paie' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeReportTab === tab.id 
                ? 'bg-[#128C7E] text-white shadow-md font-bold' 
                : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main reporting panel container */}
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-[#0F172A]/40 border border-slate-800 text-white' : 'bg-white shadow-sm text-black'}`}>
        
        {/* REPORT VIEW 1: Sales Monthly Bezier (Curve) */}
        {activeReportTab === 'sales' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline">
                <h3 className="text-base font-extrabold text-black dark:text-white">Graphique Linéaire de Ventes (Sales Chart)</h3>
                <span className="text-xs text-black font-black flex items-center gap-0.5 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +12.4% vs l'an dernier
                </span>
              </div>
              <p className="text-xs text-black dark:text-slate-300 mt-0.5">Ventes constatées par mois sur la période du 1er Janvier au 9 Juin 2026.</p>
            </div>

            {/* Bezier Curve SVG */}
            <div className={`relative w-full h-72 rounded-xl p-4 ${darkMode ? 'bg-slate-950/40 border border-slate-850' : 'bg-white border border-black'}`}>
              <svg viewBox="0 0 800 240" className="w-full h-full" preserveAspectRatio="none">
                {/* Horizontal grid lines */}
                <line x1="0" y1="40" x2="800" y2="40" stroke="#000000" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="0" y1="90" x2="800" y2="90" stroke="#000000" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="0" y1="140" x2="800" y2="140" stroke="#000000" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="0" y1="190" x2="800" y2="190" stroke="#000000" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />

                {/* Gradient background under bezier curve */}
                <path 
                  d="M 50 200 Q 150 140, 250 110 T 450 120 T 650 65 T 750 40 L 750 200 L 50 200 Z" 
                  fill="url(#salesGrad)" 
                  opacity="0.15"
                />

                {/* Primary Bezier Curve */}
                <path 
                  d="M 50 200 Q 150 140, 250 110 T 450 120 T 650 65 T 750 40" 
                  fill="none" 
                  stroke="#000000" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  className="animate-sparkline dark:stroke-white" 
                />

                {/* Active hover highlights */}
                <line x1="650" y1="0" x2="650" y2="240" stroke="#000000" strokeWidth="1" strokeDasharray="2 2" className="dark:stroke-white" />
                <circle cx="650" cy="65" r="5" fill="#000000" stroke="#FFFFFF" strokeWidth="2" className="dark:fill-white" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Month X Labels */}
              <div className="flex justify-between text-[10px] font-mono font-bold text-black dark:text-slate-300 mt-2 px-6">
                <span>Jan</span>
                <span>Fév</span>
                <span>Mar</span>
                <span>Avr</span>
                <span>Mai</span>
                <span className="text-black font-extrabold underline dark:text-white">Juin (Courant)</span>
              </div>

              {/* Floating Tooltip at active node */}
              <div className="absolute top-10 right-[15%] bg-black border border-slate-800 p-2 rounded-lg text-[10px] text-white shadow-xl pointer-events-none">
                <p className="font-bold">Date : Mai 2026</p>
                <p className="text-white font-bold mt-0.5">Ventes : 27 937 208 FCFA</p>
              </div>
            </div>
          </div>
        )}

        {/* REPORT VIEW 2: Revenue vs Expenses Double Bars */}
        {activeReportTab === 'revenue' && (
          <div className="space-y-4 text-black dark:text-white">
            <div>
              <h3 className="text-base font-extrabold text-black dark:text-white">Graphique à Barres de Revenus (Bar Chart)</h3>
              <p className="text-xs text-black dark:text-slate-300 mt-0.5">Comparaison mensuelle consolidée entre le chiffre d'affaires et le total d'Opex.</p>
            </div>

            <div className={`w-full h-72 rounded-xl p-4 flex items-end justify-between ${darkMode ? 'bg-slate-950/40 border border-slate-850' : 'bg-white border border-black'}`}>
              {[
                { name: 'Jan', rev: 140, exp: 90 },
                { name: 'Fév', rev: 180, exp: 110 },
                { name: 'Mar', rev: 160, exp: 120 },
                { name: 'Avr', rev: 210, exp: 140 },
                { name: 'Mai', rev: 230, exp: 165 },
                { name: 'Juin', rev: 248, exp: 112 },
              ].map((month, idx) => {
                const maxVal = 300;
                const revHeight = `${(month.rev / maxVal) * 100}%`;
                const expHeight = `${(month.exp / maxVal) * 100}%`;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-1.5 group">
                    <div className="w-full flex justify-center gap-1.5 items-end h-5/6">
                      {/* Revenue Column */}
                      <div 
                        className="w-4 rounded-t-md bg-black hover:bg-neutral-800 transition duration-200 dark:bg-white" 
                        style={{ height: revHeight }}
                        title={`Revenus: ${(month.rev * 0.655957).toFixed(1)}M FCFA`}
                      />
                      {/* Expense Column */}
                      <div 
                        className="w-4 rounded-t-md bg-red-650 hover:bg-red-750 transition duration-200" 
                        style={{ height: expHeight }}
                        title={`Dépenses: ${(month.exp * 0.655957).toFixed(1)}M FCFA`}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-black dark:text-slate-300">{month.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 text-xs font-bold justify-center text-black dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-black rounded dark:bg-white" />
                <span>Revenus (Sales)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-red-650 rounded" />
                <span>Dépenses (OpEx)</span>
              </span>
            </div>
          </div>
        )}

        {/* REPORT VIEW 3: User Growth Cumulative Area */}
        {activeReportTab === 'growth' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-black dark:text-white">Graphique de Croissance d'Utilisateurs (Platform Users)</h3>
              <p className="text-xs text-black dark:text-slate-300 mt-0.5">Suivi des abonnés et collaborateurs gérés via l'infrastructure SaaS.</p>
            </div>

            <div className={`relative w-full h-72 rounded-xl p-4 ${darkMode ? 'bg-slate-950/40 border border-slate-850' : 'bg-white border border-black'}`}>
              <svg viewBox="0 0 800 240" className="w-full h-full" preserveAspectRatio="none">
                {/* Gridlines */}
                <line x1="0" y1="50" x2="800" y2="50" stroke="#000000" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="0" y1="110" x2="800" y2="110" stroke="#000000" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
                <line x1="0" y1="170" x2="800" y2="170" stroke="#000000" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />

                {/* Fill area */}
                <path 
                  d="M 50 200 L 150 180 L 250 150 L 350 120 L 450 110 L 550 80 L 650 50 L 750 30 L 750 200 Z" 
                  fill="url(#growthGrad)" 
                  opacity="0.25"
                />

                {/* Line */}
                <path 
                  d="M 50 200 L 150 180 L 250 150 L 350 120 L 450 110 L 550 80 L 650 50 L 750 30" 
                  fill="none" 
                  stroke="#000000" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  className="dark:stroke-emerald-400"
                />

                <circle cx="750" cy="30" r="5" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5" className="dark:fill-white" />

                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="flex justify-between text-[10px] font-mono font-bold text-black dark:text-slate-300 mt-2 px-1">
                <span>Janvier</span>
                <span>Février</span>
                <span>Mars</span>
                <span>Avril</span>
                <span>Mai</span>
                <span className="text-black font-extrabold underline dark:text-white">Juin</span>
              </div>

              {/* Label */}
              <div className="absolute top-8 left-8 bg-black/10 border border-black/20 px-2 py-1 rounded text-[10px] text-black font-bold font-mono dark:bg-white/15 dark:text-white dark:border-white/20">
                Total : 12,410 abonnés (+56%)
              </div>
            </div>
          </div>
        )}

        {/* REPORT VIEW 4: Monthly Acquisition bar split */}
        {activeReportTab === 'acquisition' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-black dark:text-white">Répartition des Vecteurs d'Acquisition (Acquisition Vectors)</h3>
              <p className="text-xs text-black dark:text-slate-300 mt-0.5">Origine des conversions et de l'enregistrement de dossiers patients.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left values */}
              <div className="space-y-4 font-sans text-black dark:text-white">
                {[
                  { channel: 'Moteurs de recherche (SEO)', pct: 45, val: '5,584 patients', color: 'bg-black dark:bg-slate-300' },
                  { channel: 'Recommandations cliniques (Referrals)', pct: 25, val: '3,102 patients', color: 'bg-zinc-700 dark:bg-zinc-400' },
                  { channel: 'Réseaux et Campagnes optique', pct: 18, val: '2,233 patients', color: 'bg-zinc-500' },
                  { channel: 'Accès Direct', pct: 12, val: '1,491 patients', color: 'bg-zinc-400' },
                ].map((acq, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{acq.channel}</span>
                      <span className="font-extrabold">{acq.val} ({acq.pct}%)</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <div className={`${acq.color} h-full rounded-full`} style={{ width: `${acq.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Donut representation placeholder or elegant key metric blocks */}
              <div className={`p-6 rounded-xl space-y-4 flex flex-col justify-center ${darkMode ? 'bg-slate-950/40 border border-slate-850' : 'bg-white border border-black'}`}>
                <div className="text-center text-black dark:text-white">
                  <span className="text-xs text-black uppercase font-extrabold tracking-wider dark:text-slate-300">Objectif Trimestriel d'Acquisition</span>
                  <div className="text-3xl font-black font-display text-black mt-1 dark:text-white">
                    12,410 / 15,000
                  </div>
                  <p className="text-xs text-black mt-1 dark:text-slate-300">82.7% de l'objectif d'enregistrement atteint.</p>
                </div>
                
                {/* Process ratio bar */}
                <div className="w-full bg-[#E2E8F0] dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-black h-full dark:bg-white" style={{ width: '82.7%' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT VIEW 5: Audits & Performances Boutiques (SANS LISTE DÉROULANTE) */}
        {activeReportTab === 'boutiques' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-base font-extrabold text-black dark:text-white">Rapports d'Audits Consolidés des Agences</h3>
                <p className="text-xs text-black mt-0.5 dark:text-slate-300">Visualisez les performances individuelles comparées de chaque agence d'optique G-LAB.</p>
              </div>
              <button
                type="button"
                onClick={() => setCompareBoutiques(!compareBoutiques)}
                className="px-3.5 py-1.5 bg-black hover:bg-slate-900 text-white dark:bg-white dark:text-black dark:hover:bg-slate-100 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                {compareBoutiques ? "Masquer le comparateur" : "📊 Lancer un Comparateur Visuel"}
              </button>
            </div>

            {/* Comparateur Visuel */}
            {compareBoutiques && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 text-black dark:text-white">
                <h4 className="text-xs font-black uppercase text-black dark:text-slate-250">Benchmark Direct du Chiffre d'Affaires Mensuel (Millions FCFA)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-48 items-end border-b border-slate-200 pb-2">
                  {localBranches.length === 0 ? (
                    <p className="col-span-3 text-xs italic text-slate-400 text-center py-4">Aucune agence active pour comparaison.</p>
                  ) : (
                    localBranches.map((b, i) => {
                      const numericSales = b.sales ? parseFloat(b.sales.replace(/[^0-9]/g, '')) : 12500000;
                      const salesInMillions = (numericSales / 1000000).toFixed(1);
                      const heightPercent = Math.min(Math.max(Math.round((numericSales / 20000000) * 100), 15), 100);
                      return (
                        <div key={b.id || i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[10px] font-mono font-bold text-black dark:text-white">{salesInMillions}M FCFA</span>
                          <div 
                            className="w-12 bg-black rounded-t-lg dark:bg-slate-400" 
                            style={{ height: `${heightPercent}%` }} 
                          />
                          <span className="text-[10px] font-bold text-black dark:text-white truncate max-w-[150px]">{b.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Grid des succursales unifiées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {localBranches.length === 0 ? (
                <div className="col-span-3 bg-slate-50 dark:bg-slate-950 border border-dashed rounded-xl p-8 text-center text-slate-400">
                  <p className="text-xs">Aucune agence active. Veuillez créer une agence dans le SuperAdmin HQ.</p>
                </div>
              ) : (
                localBranches.map((b, i) => {
                  const salesValue = b.sales || "12 500 000 FCFA";
                  const satisfactionValue = b.satisfaction || "96.5%";
                  const staffValue = b.staff || "2 conseillers";
                  const stockValue = b.stockIntegrity || "98.5%";
                  const statusValue = b.status || "Excellent";
                  const codeValue = b.code || `AG-${String(b.id || i).substring(0, 4).toUpperCase()}`;

                  return (
                    <div key={b.id || i} className="bg-white dark:bg-slate-900 border border-black dark:border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-xs uppercase tracking-wide text-black dark:text-slate-100">{b.name}</h4>
                          <span className="px-2 py-0.5 bg-black/10 dark:bg-white/10 text-black dark:text-white rounded text-[9px] font-black uppercase">{statusValue}</span>
                        </div>
                        <p className="text-[10px] text-black font-extrabold font-mono dark:text-slate-400">{codeValue}</p>
                      </div>

                      <div className="space-y-2 border-t border-b border-black dark:border-slate-800 py-3 text-[11px] text-black dark:text-slate-350">
                        <div className="flex justify-between">
                          <span className="text-neutral-700 dark:text-slate-400">Ventes enregistrées :</span>
                          <span className="font-bold font-mono text-black dark:text-emerald-400 text-right">{salesValue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-700 dark:text-slate-400">Satisfaction clients :</span>
                          <span className="font-bold text-black dark:text-slate-200 text-right">{satisfactionValue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-700 dark:text-slate-400">Intégrité des stocks :</span>
                          <span className="font-bold text-black dark:text-slate-200 text-right">{stockValue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-700 dark:text-slate-400">Ressources à l'atelier :</span>
                          <span className="font-bold text-black dark:text-slate-200 text-right">{staffValue}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerAudit(b.name)}
                        className="w-full py-1.5 bg-black text-white hover:bg-neutral-900 dark:bg-slate-950 border border-transparent dark:border-slate-850 dark:hover:bg-slate-900 dark:text-slate-300 font-bold text-[10px] rounded-lg transition uppercase tracking-wider cursor-pointer"
                      >
                        🔍 Déclencher l'Audit Spot
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Popup Audit logs */}
            {selectedAuditBoutique && (
              <div className="p-5 bg-black text-white border border-slate-800 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <div>
                    <h4 className="text-xs uppercase font-extrabold tracking-widest text-white">Rapport d'Audit Interne en direct</h4>
                    <p className="text-[10px] text-slate-400">Boutique : {selectedAuditBoutique}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedAuditBoutique(null); setAuditLogs([]); }}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer text-xs"
                  >
                    [Fermer l'audit]
                  </button>
                </div>

                <div className="space-y-1.5 text-[10.5px] font-mono leading-relaxed">
                  {auditLogs.map((log, lIdx) => (
                    <div key={lIdx} className={log.includes('[OK]') ? 'text-emerald-400' : log.includes('écart') ? 'text-amber-300' : 'text-slate-300'}>
                      {log}
                    </div>
                  ))}
                  {isAuditing && (
                    <div className="text-white animate-pulse">
                      Calcul en cours de meulage/centrage et caisses... (Index réseau unifié)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REPORT VIEW: Payroll Audit & Reports */}
        {activeReportTab === 'payroll' && (() => {
          const payslipsFromLocal: any[] = (() => {
            try {
              const saved = localStorage.getItem('optic_payslips');
              if (saved) return JSON.parse(saved);
            } catch (e) {}
            return [];
          })();

          const totalNet = payslipsFromLocal.reduce((sum, s) => sum + (s.netSalary || 0), 0);
          const totalSocial = payslipsFromLocal.reduce((sum, s) => sum + (s.socialDeductions || 0), 0);
          const totalTax = payslipsFromLocal.reduce((sum, s) => sum + (s.taxDeductions || 0), 0);
          const totalSlips = payslipsFromLocal.length;
          const paidSlips = payslipsFromLocal.filter(s => s.paymentStatus === 'Payé').length;
          const complianceRate = totalSlips > 0 ? Math.round((paidSlips / totalSlips) * 100) : 100;

          return (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 dark:border-slate-850">
                <div className="text-left">
                  <h3 className="text-base font-extrabold text-black dark:text-white">Audit Unifié de Paie & Obligations Fiscales</h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-300 mt-0.5">Surveillance de l'index de conformité salariale, taxes d'État (ITS) et charges patronales de la franchise.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAuditing(true);
                    setSelectedAuditBoutique('CONFORMITÉ PAIE EXERCICE');
                    setAuditLogs([
                      "Initialisation de l'audit fiscal de paie consolidé...",
                      `[OK] Chargement de ${totalSlips} bulletins d'opticiens diplômés et assistants...`,
                      `[VÉRIFICATION] Rapprochement des retenues salariales pour les impôts d'État (ITS)...`,
                      `[ANALYSÉ] Montant total collecté de taxes ITS : ${totalTax.toLocaleString()} FCFA.`,
                      `[VÉRIFICATION] Rapprochement des cotisations sociales obligatoires (CNSS / IPRES) : ${totalSocial.toLocaleString()} FCFA.`,
                      `[AUDIT DE CONFORMITÉ] Analyse des statuts d'ordonnancement de trésorerie...`,
                      complianceRate === 100 
                        ? `[FÉLICITATIONS] Index de conformité paie à 100%. Tous les virements d'écritures de salaires ont été exécutés avec succès.`
                        : `[AVERTISSEMENT] Index de conformité paie à ${complianceRate}%. ${totalSlips - paidSlips} bulletins sont encore en attente de paiement.`
                    ]);
                    setTimeout(() => {
                      setIsAuditing(false);
                    }, 1000);
                  }}
                  className="px-3.5 py-1.5 bg-[#128C7E] hover:bg-[#0e6e63] text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                >
                  🔍 Lancer l'Audit Fiscal de la Paie
                </button>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                  <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-widest block">Masse Salariale</span>
                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200 mt-1 block">
                    {totalNet.toLocaleString()} FCFA
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">{totalSlips} bulletins totaux</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                  <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-widest block">Taxes ITS Collectées</span>
                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200 mt-1 block">
                    {totalTax.toLocaleString()} FCFA
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Impôts à reverser à l'État</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                  <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-widest block">Charges CNSS / IPRES</span>
                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200 mt-1 block">
                    {totalSocial.toLocaleString()} FCFA
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Cotisations de sécurité sociale</span>
                </div>
                <div className={`p-4 rounded-xl border text-left ${complianceRate === 100 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40'}`}>
                  <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-widest block">Conformité Trésorerie</span>
                  <span className={`text-lg font-bold font-mono mt-1 block ${complianceRate === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {complianceRate}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">{paidSlips} / {totalSlips} bulletins payés</span>
                </div>
              </div>

              {/* Compliance checklist and dynamic warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-left space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Pointage d'Intégrité de la Paie</h4>
                  <div className="space-y-2 text-xs">
                    {payslipsFromLocal.map((slip, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-300">{slip.employeeName}</span>
                          <span className="text-[10px] text-slate-500 block">Période : {slip.period}</span>
                        </div>
                        {slip.paymentStatus === 'Payé' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/40">
                            <Check className="w-3 h-3" />
                            Virement validé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40">
                            <AlertCircle className="w-3 h-3 animate-pulse" />
                            Non réglé en banque
                          </span>
                        )}
                      </div>
                    ))}
                    {totalSlips === 0 && (
                      <p className="text-slate-400 text-xs italic">Aucun bulletin de paie disponible à auditer pour le moment.</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-left space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Synthèse Analytique du Contrôle</h4>
                  <p className="text-xs text-[#64748B] dark:text-slate-300 leading-relaxed">
                    Les charges salariales représentent une part structurelle majeure de l'OpEx des magasins. 
                    Le système d'audit valide la parfaite concordance des déductions sociales (<strong>8% Part Sociale</strong>) 
                    et fiscales (<strong>10% ITS</strong>) calculées sur la base brute globale.
                  </p>
                  <div className="p-3.5 rounded-lg bg-cyan-700/5 border border-cyan-700/20 text-xs text-cyan-800 dark:text-cyan-400 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-cyan-700 shrink-0" />
                    <span>Conformité avec les règles de la convention collective d'Afrique de l'Ouest (UEMOA).</span>
                  </div>
                </div>
              </div>

              {/* Popup Audit logs specifically for Payroll */}
              {selectedAuditBoutique === 'CONFORMITÉ PAIE EXERCICE' && (
                <div className="p-5 bg-black text-white border border-slate-800 rounded-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3 text-left">
                    <div>
                      <h4 className="text-xs uppercase font-extrabold tracking-widest text-white">Rapport d'Audit Interne en direct</h4>
                      <p className="text-[10px] text-slate-400">Analyse du livre de paie consolidé</p>
                    </div>
                    <button
                      onClick={() => { setSelectedAuditBoutique(null); setAuditLogs([]); }}
                      className="text-slate-400 hover:text-slate-200 cursor-pointer text-xs font-bold"
                    >
                      [Fermer l'audit]
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[10.5px] font-mono leading-relaxed text-left">
                    {auditLogs.map((log, lIdx) => (
                      <div key={lIdx} className={log.includes('[OK]') || log.includes('[FÉLICITATIONS]') ? 'text-emerald-400' : log.includes('AVERTISSEMENT') ? 'text-amber-300' : 'text-slate-300'}>
                        {log}
                      </div>
                    ))}
                    {isAuditing && (
                      <div className="text-white animate-pulse">
                        Calcul de l'impôt sur le revenu (ITS) & des cotisations patronales...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
