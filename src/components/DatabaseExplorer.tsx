import React, { useState } from 'react';
import { dbTables } from '../data/dbSchemas';
import { Database, ShieldAlert, Key, HelpCircle, Columns, Lock } from 'lucide-react';

export default function DatabaseExplorer() {
  const [selectedTable, setSelectedTable] = useState(dbTables[0]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800" id="database-explorer-container">
      
      {/* Table Sorter List (Left 4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <h3 className="font-display font-semibold text-sm tracking-widest text-slate-500 uppercase flex items-center gap-2 px-1">
          <Database className="w-4 h-4 text-emerald-600" />
          Tables PostgreSQL
        </h3>
        <p className="text-xs text-slate-500 px-1 leading-relaxed">
          Cliquez sur une table pour analyser sa structure relationnelle et ses politiques Row-Level Security (RLS) de Supabase.
        </p>

        <div className="space-y-2">
          {dbTables.map((table) => {
            const isSelected = selectedTable.name === table.name;
            return (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative group flex justify-between items-center ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                    : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="font-mono text-sm font-semibold flex items-center gap-2 text-slate-800">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    {table.name}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 max-w-xs">{table.description}</div>
                </div>

                {table.isTenantSpecific && (
                  <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    tenant
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table details Panel (Right 8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 lg:p-8 space-y-8 shadow-sm">
        
        {/* Table summary */}
        <div className="space-y-2 pb-6 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-mono font-semibold text-slate-850 tracking-tight flex items-center gap-2">
              <span className="text-emerald-600">table</span> {selectedTable.name}
            </h2>
            
            {selectedTable.isTenantSpecific && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono border border-indigo-100">
                <Lock className="w-3.5 h-3.5" />
                SaaS Isolé (Row Level Security Actif)
              </div>
            )}
          </div>
          <p className="text-slate-650 text-sm leading-relaxed">{selectedTable.description}</p>
        </div>

        {/* Database Columns Structure */}
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-sm tracking-wider text-slate-850 flex items-center gap-2">
            <Columns className="w-4.5 h-4.5 text-indigo-650" />
            Structure des Colonnes / Types de Données
          </h3>
          <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-semibold">Nom</th>
                  <th className="p-4 font-semibold">Type de donnée</th>
                  <th className="p-4 font-semibold">Contraintes</th>
                  <th className="p-4 font-semibold font-sans">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedTable.columns.map((column) => (
                  <tr key={column.name} className="hover:bg-slate-50/50">
                    <td className="p-4 font-semibold text-emerald-700">{column.name}</td>
                    <td className="p-4 text-slate-700">{column.type}</td>
                    <td className="p-4 text-slate-500 text-[10px]">{column.constraints || '—'}</td>
                    <td className="p-4 text-slate-600 font-sans text-xs leading-normal">{column.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supabase Row-Level Security Rules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm tracking-wider text-slate-850 flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
              Politiques Row-Level Security (RLS) associées
            </h3>
            <span className="text-[10px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              Postgres Engine Enforced
            </span>
          </div>

          <div className="space-y-3">
            {selectedTable.policies.map((policy) => (
              <div
                key={policy.name}
                className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-[#0097a7] font-semibold">{policy.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-600">
                      ON: {policy.action}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-600">
                      ROLES: {policy.roles.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[10px] text-rose-600 overflow-x-auto font-bold">
                  <span className="text-slate-400 mr-2 font-normal">USING</span>
                  {policy.using}
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">{policy.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
