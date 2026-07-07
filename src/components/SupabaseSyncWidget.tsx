import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, CloudLightning, CloudOff, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft
} from 'lucide-react';
import { subscribeToSyncState, pullAllCollectionsFromSupabase, SyncState } from '../lib/supabaseSync';

export default function SupabaseSyncWidget() {
  const [syncState, setSyncState] = useState<SyncState>({
    loading: true,
    status: 'loading',
    error: null,
    lastSyncedAt: null
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    // Subscribe to live sync engine state changes
    const unsubscribe = subscribeToSyncState((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleManualRetry = async () => {
    await pullAllCollectionsFromSupabase();
  };

  // Status-specific configuration
  const getStatusConfig = () => {
    switch (syncState.status) {
      case 'loading':
        return {
          icon: <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />,
          label: 'Chargement Supabase...',
          bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
          dotColor: 'bg-amber-400 animate-pulse'
        };
      case 'saving':
        return {
          icon: <CloudLightning className="w-4 h-4 text-indigo-400 animate-pulse" />,
          label: 'Sauvegarde cloud...',
          bgColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200',
          dotColor: 'bg-indigo-400 animate-ping'
        };
      case 'error':
        return {
          icon: <CloudOff className="w-4 h-4 text-rose-400" />,
          label: 'Erreur de connexion',
          bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
          dotColor: 'bg-rose-400'
        };
      case 'synced':
      default:
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: 'Synchro Supabase Active',
          bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
          dotColor: 'bg-emerald-400'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div id="supabase-sync-indicator-widget" className="fixed bottom-6 right-6 z-[9999] pointer-events-auto">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="collapsed-pill"
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            onClick={() => setIsExpanded(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border shadow-2xl backdrop-blur-md cursor-pointer transition-all duration-300 ${config.bgColor} bg-slate-900/90 hover:scale-105`}
          >
            <div className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor.split(' ')[0]}`}></span>
            </div>
            {config.icon}
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase hidden sm:inline">
              {config.label}
            </span>
            <ChevronLeft className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-72 bg-slate-900/95 border border-slate-700/60 rounded-2xl shadow-2xl p-4 text-white backdrop-blur-lg flex flex-col gap-3 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
                  Base de Données Cloud
                </span>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{config.icon}</div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-100">{config.label}</p>
                {syncState.error ? (
                  <p className="text-[10px] text-rose-300 mt-1 flex items-center gap-1 leading-relaxed">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{syncState.error}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Toutes les opérations d'écriture et de lecture sont persistées en temps réel sur PostgreSQL.
                  </p>
                )}
              </div>
            </div>

            {/* Timestamps & Info */}
            <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/45 flex flex-col gap-1.5 text-[10px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Dernière synchro :</span>
                <span className="text-slate-200 font-bold">
                  {syncState.lastSyncedAt || 'En attente'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mode :</span>
                <span className="text-emerald-400 font-bold">Direct Supabase DB</span>
              </div>
              <div className="flex justify-between">
                <span>Synchronisation :</span>
                <span className="text-sky-400 font-bold">Temps Réel</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleManualRetry}
                disabled={syncState.status === 'loading'}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold py-2 px-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncState.status === 'loading' ? 'animate-spin' : ''}`} />
                <span>Recharger</span>
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
