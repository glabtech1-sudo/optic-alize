import React from 'react';
import { Network, Database, Layers, ShieldCheck, Cpu, RefreshCw } from 'lucide-react';

export default function ArchitectureBlueprint() {
  return (
    <div className="space-y-8" id="clean-arch-blueprint">
      {/* Introduction Header */}
      <div className="bg-white text-slate-800 rounded-2xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-50/20 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono tracking-wider uppercase border border-indigo-100">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            G-LAB OPTIC Global Blueprint
          </div>
          <h2 className="text-3xl font-display font-semibold tracking-tight text-slate-850">
            Architecture SaaS ERP de Réfraction & Lunetterie
          </h2>
          <p className="text-slate-600 max-w-3xl text-sm leading-relaxed">
            G-LAB OPTIC combine de manière optimale l'architecture réactive de <strong>Flutter Web</strong> et <strong>Riverpod</strong> avec la robustesse d'un backend orchestrateur en <strong>Node.js / Express</strong> connecté à <strong>PostgreSQL</strong> (propulsé par Supabase). L'isolation multi-boutique est assurée au niveau le plus basique de la base de données via les politiques d'accès <strong>RLS (Row-Level Security)</strong> de Supabase.
          </p>
        </div>
      </div>

      {/* Grid of the 3 Key Systems */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core 1: Frontend Clean Architecture */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 hover:border-[#0097a7]/30 transition duration-300 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-50 rounded-lg text-[#0097a7]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-800">Frontend Clean Arch</h3>
              <p className="text-xs text-slate-500 font-mono">Flutter Web + Riverpod</p>
            </div>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Couches rigoureusement séparées garantissant la testabilité et la modularité internationale de l'ERP.
          </p>
          
          <div className="space-y-3 pt-2 font-mono text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative pl-8">
              <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-cyan-500"></div>
              <strong className="text-cyan-705 block">Presentation Layer</strong>
              <span className="text-slate-500 text-[10px]">Material 3 Pages, Widgets & State providers (Riverpod + StateNotifier)</span>
            </div>
            <div className="flex justify-center my-1 text-slate-400">↓</div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative pl-8">
              <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-emerald-500"></div>
              <strong className="text-emerald-705 block">Domain Layer (Modulable)</strong>
              <span className="text-slate-500 text-[10px]">Entities pures (FrameEntity, Prescription), UseCases métiers, Interfaces Repositories</span>
            </div>
            <div className="flex justify-center my-1 text-slate-400">↓</div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative pl-8">
              <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-amber-500"></div>
              <strong className="text-amber-705 block">Data Layer (Supabase)</strong>
              <span className="text-slate-500 text-[10px]">Data Models (JSON ser/deser), Repositories Implementations connectés au Client Supabase</span>
            </div>
          </div>
        </div>

        {/* Core 2: Backend Orchestration & WS */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 hover:border-[#0097a7]/30 transition duration-300 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-800">Backend Orchestrator</h3>
              <p className="text-xs text-slate-500 font-mono">Node.js + Express + WebSockets</p>
            </div>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Centralise le routage sécurisé, l'intégration des tiers payants (sécurité clés secrètes) et émet les sockets de stock en temps réel.
          </p>
          
          <div className="space-y-3 pt-2 font-mono text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative pl-8">
              <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-indigo-500"></div>
              <strong className="text-indigo-705 block">Express JWT Handler</strong>
              <span className="text-slate-500 text-[10px]">Intercepte Supabase Auth JWT, valide le rôle de l'opticien et décode le tenant_id</span>
            </div>
            <div className="flex justify-center my-1 text-slate-400">↓</div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative pl-8">
              <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-pink-500"></div>
              <strong className="text-pink-705 block">WS Broadcasting Bus</strong>
              <span className="text-slate-500 text-[10px]">Associe les websockets actifs aux boutiques physiques d'appartenance pour push en temps réel</span>
            </div>
            <div className="flex justify-center my-1 text-slate-400">↓</div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative pl-8">
              <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-violet-500"></div>
              <strong className="text-violet-705 block">External Mutuelles Gateway</strong>
              <span className="text-slate-500 text-[10px]">Vérifie la validité des prises en charge complémentaires via API tierces sécurisées</span>
            </div>
          </div>
        </div>

        {/* Core 3: Tenant Security & RLS Database */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 hover:border-[#0097a7]/30 transition duration-300 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-800">PostgreSQL SaaS Isolation</h3>
              <p className="text-xs text-slate-500 font-mono">Row-Level Security (RLS)</p>
            </div>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Conserve une base de données unique à haute performance, tout en érigeant une cloison étanche blindée entre chaque franchise.
          </p>
          
          <div className="space-y-3 pt-2 font-mono text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative pl-8">
              <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-emerald-500"></div>
              <strong className="text-emerald-705 block">JWT Native Metadata Filter</strong>
              <span className="text-slate-500 text-[10px]">PostgreSQL extrait l'identifiant <code className="text-violet-700 bg-slate-100 px-1 py-0.5 rounded">tenant_id</code> directement du JWT d'authentification</span>
            </div>
            <div className="flex justify-center my-1 text-slate-400">↓</div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative pl-8">
              <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-red-400"></div>
              <strong className="text-red-705 block">Boutiques & Inventory RLS</strong>
              <span className="text-slate-500 text-[10px]">Toutes les requêtes d'inventaire échouent silencieusement si un utilisateur tente de tricher avec un ID concurrent</span>
            </div>
            <div className="flex justify-center my-1 text-slate-400">↓</div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 relative pl-8">
              <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-blue-500"></div>
              <strong className="text-blue-705 block">Supabase Storage Policies</strong>
              <span className="text-slate-500 text-[10px]">Seuls les opticiens de la chaîne de boutiques peuvent charger/lire les ordonnances scannées</span>
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Data Flowchart Simulation */}
      <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-lg font-display font-semibold text-slate-800 flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-600 animate-pulse" />
          Simulation des Flux d'Événements Optic Alizé (Synchro Vente)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center text-xs font-mono">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-cyan-700 flex flex-col justify-between h-32">
            <span className="text-slate-500 text-[10px] uppercase">1. Vente Front</span>
            <span className="font-semibold text-slate-800">Vendeur valide une monture Ray-Ban</span>
            <div className="text-slate-405 font-sans text-[10px]">Riverpod local update</div>
          </div>
          
          <div className="flex flex-col justify-center items-center text-indigo-600 font-sans font-medium text-xs">
            <span>Boutique HTTP RPC</span>
            <span className="text-lg">→</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-indigo-700 flex flex-col justify-between h-32">
            <span className="text-slate-500 text-[10px] uppercase">2. Backend Node</span>
            <span className="font-semibold text-slate-800">Express décrémente l'inventaire</span>
            <div className="text-slate-405 font-sans text-[10px]">PostgreSQL Transaction</div>
          </div>

          <div className="flex flex-col justify-center items-center text-indigo-600 font-sans font-medium text-xs">
            <span>WebSocket Broadcast</span>
            <span className="text-lg">→</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-emerald-705 flex flex-col justify-between h-32">
            <span className="text-slate-500 text-[10px] uppercase">3. Synchro Multi-Boutique</span>
            <span className="font-semibold text-slate-800">Toutes les sessions de l'enseigne se mettent à jour</span>
            <div className="text-slate-405 font-sans text-[10px]">Riverpod State sync</div>
          </div>
        </div>
      </div>
    </div>
  );
}
