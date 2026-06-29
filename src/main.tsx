import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
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
