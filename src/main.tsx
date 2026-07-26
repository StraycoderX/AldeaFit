import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppProvider } from './state/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element missing');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Register the service worker for offline use. Failure is non-fatal: the app
// simply behaves like a normal website. The flag is compiled out by the
// single-file build, which has no sibling worker script to register.
declare const __ENABLE_SERVICE_WORKER__: boolean | undefined;
const serviceWorkerEnabled =
  typeof __ENABLE_SERVICE_WORKER__ === 'undefined' || __ENABLE_SERVICE_WORKER__;

if ('serviceWorker' in navigator && import.meta.env.PROD && serviceWorkerEnabled) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {
        /* Offline support unavailable; nothing else is affected. */
      });
  });
}
