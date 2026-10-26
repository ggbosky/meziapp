import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { ServicesProvider } from './app/AppContext';
import { ToastProvider } from './components/ui/Toast';
import { createLocalServices } from './services/local/createLocalServices';
import { getBrowserStorage } from './storage/store';
import './index.css';

// Jediné místo, kde se volí implementace služeb. Pro backend by se zde
// místo createLocalServices vytvořila implementace volající API.
const services = createLocalServices({ storage: getBrowserStorage() });
services.store.connectToWindow(window);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServicesProvider services={services}>
      <ToastProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ToastProvider>
    </ServicesProvider>
  </StrictMode>,
);
