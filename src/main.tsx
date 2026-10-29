import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { ServicesProvider } from './app/AppContext';
import { ErrorBoundary } from './components/feedback/ErrorBoundary';
import { ErrorScreen } from './components/feedback/ErrorScreen';
import { ToastProvider } from './components/ui/Toast';
import { createLocalServices } from './services/local/createLocalServices';
import { getBrowserStorage } from './storage/store';
import './index.css';

declare global {
  interface Window {
    /** Značka pro hlídač v index.html, že se aplikace spustila. */
    __meziMounted?: boolean;
  }
}

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

try {
  // Jediné místo, kde se volí implementace služeb. Pro backend by se zde
  // místo createLocalServices vytvořila implementace volající API.
  const services = createLocalServices({ storage: getBrowserStorage() });
  services.store.connectToWindow(window);

  root.render(
    <StrictMode>
      <ErrorBoundary fallback={({ error }) => <ErrorScreen error={error} fullPage />}>
        <ServicesProvider services={services}>
          <ToastProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </ToastProvider>
        </ServicesProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  // Selhání ještě před vykreslením (např. inicializace dat) také ukáže chybovou obrazovku.
  root.render(<ErrorScreen error={error instanceof Error ? error : new Error(String(error))} fullPage />);
} finally {
  window.__meziMounted = true;
}
