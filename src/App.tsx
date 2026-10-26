import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { ApplicationDetailPage } from './pages/admin/ApplicationDetailPage';
import { ApplicationsPage } from './pages/admin/ApplicationsPage';
import { AppointmentsAdminPage } from './pages/admin/AppointmentsAdminPage';
import { AuditPage } from './pages/admin/AuditPage';
import { ProfilesPage } from './pages/admin/ProfilesPage';
import { AppointmentDetailPage } from './pages/client/AppointmentDetailPage';
import { BookingConfirmedPage } from './pages/client/BookingConfirmedPage';
import { BookingPage } from './pages/client/BookingPage';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ApplicationPage } from './pages/professional/ApplicationPage';
import { AvailabilityPage } from './pages/professional/AvailabilityPage';
import { ConsultationsPage } from './pages/professional/ConsultationsPage';
import { ProfessionalIndex, ProfessionalLayout } from './pages/professional/ProfessionalLayout';
import { ProfilePage } from './pages/professional/ProfilePage';
import { HomePage } from './pages/public/HomePage';
import { AboutPrototypePage, ForProfessionalsPage, NotFoundPage, UrgentHelpPage } from './pages/public/InfoPages';
import { PsychologistDetailPage } from './pages/public/PsychologistDetailPage';
import { PsychologistsPage } from './pages/public/PsychologistsPage';
import { TryDemoPage } from './pages/public/TryDemoPage';

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
