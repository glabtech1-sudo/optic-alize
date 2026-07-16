import './utils/safeStoragePolyfill.ts';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import { initializeAutomaticSupabaseSync, pullAllCollectionsFromSupabase, subscribeToSupabaseRealtime } from './lib/supabaseSync.ts';

// Initialize Supabase automatic synchronization and pull existing cloud data with comprehensive diagnostic systems
console.log('[STARTUP] Initialisation de safeStoragePolyfill terminée au chargement du module.');

try {
  console.log('[STARTUP] Étape 1 : Initialisation de la synchronisation automatique Supabase...');
  try {
    initializeAutomaticSupabaseSync();
    console.log('[STARTUP] Étape 1 terminée avec succès.');
  } catch (supabaseInitErr: any) {
    console.error('[STARTUP ERROR] Échec de l\'initialisation Supabase:', supabaseInitErr);
    throw new Error(`Échec d'initialisation de Supabase : ${supabaseInitErr.message || supabaseInitErr}`);
  }

  console.log('[STARTUP] Étape 2 : Chargement des collections depuis Supabase...');
  pullAllCollectionsFromSupabase()
    .then(success => {
      console.log('[STARTUP] Étape 2 (asynchrone) terminée. Succès du pull:', success);
      if (success) {
        try {
          console.log('[STARTUP] Étape 3 : Activation du temps réel Supabase...');
          subscribeToSupabaseRealtime();
          console.log('[STARTUP] Étape 3 terminée avec succès.');
        } catch (realtimeErr) {
          console.warn('[STARTUP WARNING] Échec de l\'abonnement temps réel Supabase:', realtimeErr);
        }
      }
    })
    .catch(err => {
      console.warn('[STARTUP WARNING] Erreur asynchrone lors de la récupération initiale Supabase:', err);
    });

  console.log('[STARTUP] Étape 4 : Rendu React de l\'application...');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("L'élément DOM '#root' n'a pas pu être trouvé dans la page.");
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes cache stale time
        refetchOnWindowFocus: false,
      },
    },
  });

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </QueryClientProvider>
    </StrictMode>,
  );
  console.log('[STARTUP] Application React montée et rendue avec succès.');

} catch (globalStartupError: any) {
  console.error('[STARTUP CRITICAL ERROR] Crash durant le démarrage initial:', globalStartupError);
  
  // Affichage direct de l'exception dans le DOM pour éviter la page blanche
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background-color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background-color: white; max-width: 550px; width: 100%; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center;">
          <div style="width: 64px; height: 64px; background-color: #fff1f2; border: 1px solid #ffe4e6; color: #f43f5e; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
            <svg style="width: 32px; height: 32px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 style="font-size: 18px; font-weight: 850; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: -0.025em;">Erreur de Démarrage Critique</h1>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 24px; line-height: 1.5;">Une exception a empêché le chargement de l'application React. Les détails du diagnostic ont été collectés ci-dessous :</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: left; margin-bottom: 24px; overflow-x: auto;">
            <pre style="margin: 0; font-family: monospace; font-size: 11px; font-weight: 700; color: #be123c; white-space: pre-wrap; word-break: break-all;">${globalStartupError?.stack || globalStartupError?.toString() || 'Erreur inconnue'}</pre>
          </div>
          <button onclick="window.location.reload()" style="width: 100%; height: 44px; background-color: #10b981; color: white; border: none; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em; transition: background-color 0.15s; outline: none;">Réessayer de charger</button>
        </div>
      </div>
    `;
  }
}

// Register Progressive Web App Service Worker with sandbox/iframe resilience
try {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      try {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Optic Alizé Service Worker registered successfully:', registration.scope);
          })
          .catch((error) => {
            console.warn('Optic Alizé Service Worker registration failed:', error);
          });
      } catch (err) {
        console.warn('Service Worker registration rejected by window environment:', err);
      }
    });
  }
} catch (e) {
  console.warn('Service Worker is not supported or is blocked by sandbox constraints in this environment:', e);
}
