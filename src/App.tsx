import { lazy, type ComponentType } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AppointmentDetailPage } from './pages/client/AppointmentDetailPage';
import { BookingConfirmedPage } from './pages/client/BookingConfirmedPage';
import { BookingPage } from './pages/client/BookingPage';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { HomePage } from './pages/public/HomePage';
import { AboutPrototypePage, ForProfessionalsPage, NotFoundPage, UrgentHelpPage } from './pages/public/InfoPages';
import { PsychologistDetailPage } from './pages/public/PsychologistDetailPage';
import { PsychologistsPage } from './pages/public/PsychologistsPage';
import { TryDemoPage } from './pages/public/TryDemoPage';

// Části pro odborníky a administraci se stahují až při prvním otevření,
// aby byl první start aplikace pro klienty co nejrychlejší.
const named = <T extends Record<string, unknown>, K extends keyof T>(load: () => Promise<T>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] as ComponentType })));

const ProfessionalLayout = named(() => import('./pages/professional/ProfessionalLayout'), 'ProfessionalLayout');
const ProfessionalIndex = named(() => import('./pages/professional/ProfessionalLayout'), 'ProfessionalIndex');
const ApplicationPage = named(() => import('./pages/professional/ApplicationPage'), 'ApplicationPage');
const AvailabilityPage = named(() => import('./pages/professional/AvailabilityPage'), 'AvailabilityPage');
const ConsultationsPage = named(() => import('./pages/professional/ConsultationsPage'), 'ConsultationsPage');
const ProfilePage = named(() => import('./pages/professional/ProfilePage'), 'ProfilePage');
const AdminLayout = named(() => import('./pages/admin/AdminLayout'), 'AdminLayout');
const AdminOverview = named(() => import('./pages/admin/AdminOverview'), 'AdminOverview');
const ApplicationsPage = named(() => import('./pages/admin/ApplicationsPage'), 'ApplicationsPage');
const ApplicationDetailPage = named(() => import('./pages/admin/ApplicationDetailPage'), 'ApplicationDetailPage');
const ProfilesPage = named(() => import('./pages/admin/ProfilesPage'), 'ProfilesPage');
const AppointmentsAdminPage = named(() => import('./pages/admin/AppointmentsAdminPage'), 'AppointmentsAdminPage');
const AuditPage = named(() => import('./pages/admin/AuditPage'), 'AuditPage');

/** Trasy aplikace. Router (HashRouter v prohlížeči, MemoryRouter v testech) dodává volající. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="psychologove" element={<PsychologistsPage />} />
        <Route path="psychologove/:profileId" element={<PsychologistDetailPage />} />
        <Route path="rezervace/:profileId" element={<BookingPage />} />
        <Route path="pro-odborniky" element={<ForProfessionalsPage />} />
        <Route path="nalehava-pomoc" element={<UrgentHelpPage />} />
        <Route path="o-prototypu" element={<AboutPrototypePage />} />
        <Route path="vyzkouset" element={<TryDemoPage />} />

        <Route path="klient" element={<ClientDashboard />} />
        <Route path="klient/rezervace/:appointmentId" element={<AppointmentDetailPage />} />
        <Route path="klient/rezervace/:appointmentId/potvrzeno" element={<BookingConfirmedPage />} />

        <Route path="odbornik" element={<ProfessionalLayout />}>
          <Route index element={<ProfessionalIndex />} />
          <Route path="prihlaska" element={<ApplicationPage />} />
          <Route path="terminy" element={<AvailabilityPage />} />
          <Route path="konzultace" element={<ConsultationsPage />} />
          <Route path="profil" element={<ProfilePage />} />
        </Route>

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="zadosti" element={<ApplicationsPage />} />
          <Route path="zadosti/:applicationId" element={<ApplicationDetailPage />} />
          <Route path="profily" element={<ProfilesPage />} />
          <Route path="rezervace" element={<AppointmentsAdminPage />} />
          <Route path="historie" element={<AuditPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
