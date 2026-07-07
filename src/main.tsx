import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { initializeAutomaticSupabaseSync, pullAllCollectionsFromSupabase, subscribeToSupabaseRealtime } from './lib/supabaseSync.ts';

// Initialize Supabase automatic synchronization and pull existing cloud data
initializeAutomaticSupabaseSync();
pullAllCollectionsFromSupabase().then(success => {
  if (success) {
    console.log('[SUPABASE] Initial database state successfully loaded on boot.');
    // Enable real-time subscriptions for instant table-level sync
    subscribeToSupabaseRealtime();
  }
}).catch(err => {
  console.warn('[SUPABASE] Error pulling database state on boot:', err);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache stale time
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);

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
