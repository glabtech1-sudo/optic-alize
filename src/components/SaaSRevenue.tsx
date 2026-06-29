import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Printer, AlertCircle, ShoppingBag, Eye, TrendingUp } from 'lucide-react';

interface SaaSRevenueProps {
  darkMode?: boolean;
}

export default function SaaSRevenue({ darkMode = false }: SaaSRevenueProps) {
  // Analytical ledger entries
  const [ledger, setLedger] = useState([
    { id: 'TXN-9014', label: 'Remboursement Mutuelle MGEN', category: 'Recette', type: 'Credit', amount: 485.20, date: '2026-06-09', status: 'Approved' },
    { id: 'TXN-9013', label: 'Vente Monture Chanel #ORD-9836', category: 'Vente comptoir', type: 'Credit', amount: 1120.00, date: '2026-06-08', status: 'Approved' },
    { id: 'TXN-9012', label: 'Achat Verres EDI Essilor Lab', category: 'Abonnement / Stock', type: 'Debit', amount: 3450.00, date: '2026-06-07', status: 'Approved' },
    { id: 'TXN-9011', label: 'Paiement Salaire - Khadija Sy (RH)', category: 'Salaires', type: 'Debit', amount: 1650.00, date: '2026-06-05', status: 'Approved' },
    { id: 'TXN-9010', label: 'Rembousement Sécurité Sociale SAS', category: 'Recette', type: 'Credit', amount: 142.10, date: '2026-06-05', status: 'Approved' },
  ]);

  return (
    <div className={`p-1 space-y-6 ${darkMode ? 'dark text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Comptabilité, Trésorerie & Analyse</h2>
          <p className="text-xs text-[#64748B] mt-1 dark:text-slate-400">
            Audit des flux financiers, livres de comptes, règlements d'assurance santé mutuelle et marges consolidées.
          </p>
        </div>
        <button className={`flex items-center gap-2 px-3.5 py-1.5 text-xs hover:bg-[#E2E8F0] font-semibold rounded-lg transition duration-150 cursor-pointer ${darkMode ? 'bg-[#F1F5F9]/10 border border-slate-800 text-slate-350' : 'bg-slate-100 text-[#334155]'}`}>
          <Printer className="w-3.5 h-3.5" />
          <span>Exporter Journal comptable</span>
        </button>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1 */}
        <div className={`p-5 rounded-xl ${darkMode ? 'bg-[#0F172A]/40 border border-slate-800 shadow-sm' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Actifs nets disponibles</span>
            <span className="p-1.5 bg-[#DCFCE7] text-[#166534] rounded-lg text-xs font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +14.2%
            </span>
          </div>
          <p className="text-2xl font-bold font-display mt-3">248,590.20 €</p>
          <div className={`text-[10px] text-[#64748B] dark:text-slate-400 font-mono mt-1 pt-2 flex justify-between ${darkMode ? 'border-t border-slate-800' : ''}`}>
            <span>Marge commerciale brute</span>
            <span className="font-bold text-emerald-600">~62.4%</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className={`p-5 rounded-xl ${darkMode ? 'bg-[#0F172A]/40 border border-slate-800 shadow-sm' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Coût des achats (OpEx)</span>
            <span className="p-1.5 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-xs font-bold flex items-center gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              -2.1%
            </span>
          </div>
          <p className="text-2xl font-bold font-display mt-3 font-mono">112,410.00 €</p>
          <div className={`text-[10px] text-[#64748B] dark:text-slate-400 font-mono mt-1 pt-2 flex justify-between ${darkMode ? 'border-t border-slate-800' : ''}`}>
            <span>Frais généraux de structures</span>
            <span className="font-bold text-rose-500">22% du CA</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className={`p-5 rounded-xl ${darkMode ? 'bg-[#0F172A]/40 border border-slate-800 shadow-sm' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Bénéfice Net imposable</span>
            <span className="p-1.5 bg-[#DBEAFE] text-[#1E40AF] rounded-lg text-xs font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Optimal
            </span>
          </div>
          <p className="text-2xl font-bold font-display mt-3 text-emerald-600">182,400.00 €</p>
          <div className={`text-[10px] text-[#64748B] dark:text-slate-400 font-mono mt-1 pt-2 flex justify-between ${darkMode ? 'border-t border-slate-800' : ''}`}>
            <span>Impôts provisionnés (ITS)</span>
            <span className="font-bold text-amber-600">14,210.00 €</span>
          </div>
        </div>
      </div>

      {/* Analytics chart and tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph representation */}
        <div className={`lg:col-span-4 p-5 rounded-xl ${darkMode ? 'bg-[#0F172A]/40 border border-slate-800 shadow-sm' : 'bg-white shadow-sm'} flex flex-col justify-between`}>
          <div>
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider block">Répartition des charges</span>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">Structure opérationnelle mensuelle consolidée</p>
          </div>

          <div className="py-6 space-y-3.5 font-sans">
            {[
              { label: 'Achat Matériel (Verres, Montures)', pct: 45, val: '50,580 €', color: 'bg-[#2563EB]' },
              { label: 'Ressources Humaines (Salaires, Charges)', pct: 32, val: '35,970 €', color: 'bg-emerald-500' },
              { label: 'Logistique / EDI Lab services', pct: 15, val: '16,860 €', color: 'bg-indigo-500' },
              { label: 'Amortissement Atelier & Frais fixes', pct: 8, val: '9,000 €', color: 'bg-amber-500' }
            ].map((charge, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-350">{charge.label}</span>
                  <span className="font-bold">{charge.val} ({charge.pct}%)</span>
                </div>
                <div className="w-full bg-[#E2E8F0] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className={`${charge.color} h-full rounded-full`} style={{ width: `${charge.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-[#64748B] dark:text-slate-400 font-mono flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Le ratio d'acquisition Opex est conforme aux prévisions ERP.</span>
          </div>
        </div>

        {/* Ledger list */}
        <div className={`lg:col-span-8 p-5 rounded-xl ${darkMode ? 'bg-[#0F172A]/40 border border-slate-800 shadow-sm' : 'bg-white shadow-sm'}`}>
          <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider block mb-4">Dernières écritures au Grand-Livre</span>

          <div className={`overflow-x-auto rounded-lg ${darkMode ? 'border border-slate-800' : 'border-none'}`}>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`text-[#64748B] dark:text-slate-400 uppercase font-semibold ${darkMode ? 'border-b border-slate-800 bg-slate-900/30' : 'bg-white'}`}>
                  <th className="px-4 py-3">Code Transac.</th>
                  <th className="px-4 py-3">Libellé d'Écriture</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'divide-y divide-slate-800' : ''}`}>
                {ledger.map((txn, idx) => (
                  <tr 
                    key={txn.id} 
                    className={`hover:bg-[#EFF6FF]/60 dark:hover:bg-[#EFF6FF]/10 transition duration-150 ${idx % 2 === 0 ? (darkMode ? 'bg-[#0F172A]/10' : 'bg-[#FFFFFF]') : (darkMode ? 'bg-[#0F172A]/20' : 'bg-[#FFFFFF]')}`}
                  >
                    <td className="px-4 py-3 font-mono text-[#2563EB] font-bold">{txn.id}</td>
                    <td className="px-4 py-3 font-semibold">{txn.label}</td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${txn.type === 'Credit' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
                        {txn.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{txn.date}</td>
                    <td className={`px-4 py-3 text-right font-bold font-mono ${txn.type === 'Credit' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {txn.type === 'Credit' ? '+' : '-'}{txn.amount.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
