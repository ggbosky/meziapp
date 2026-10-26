import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { ServicesProvider } from '../app/AppContext';
import { ToastProvider } from '../components/ui/Toast';
import type { LocalServices } from '../services/local/createLocalServices';
import { createTestServices, MemoryStorage } from './helpers';

/** Vykreslí celou aplikaci nad testovacími službami (pevný čas, úložiště v paměti). */
export function renderApp(path: string, services: LocalServices = createTestServices(new MemoryStorage())) {
  const user = userEvent.setup();
  const utils = render(
    <ServicesProvider services={services}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </ToastProvider>
    </ServicesProvider>,
  );
  return { ...utils, user, services };
}
