import { CalendarRange, ClipboardCheck, History, LayoutDashboard, UsersRound } from 'lucide-react';
import { useDemoSnapshot, useServices } from '../../app/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RequireRole } from '../../components/layout/RequireRole';

export function AdminLayout() {
  return (
    <RequireRole role="admin">
      <AdminNav />
    </RequireRole>
  );
}

function AdminNav() {
  const { admin } = useServices();
  useDemoSnapshot();
  const pending = admin.listApplications().filter((a) => a.status === 'submitted').length;
  return (
    <DashboardLayout
      title="Administrace"
      subtitle="Provozní přehled (demo)"
      nav={[
        { to: '/admin', label: 'Přehled', icon: <LayoutDashboard aria-hidden />, end: true },
        { to: '/admin/zadosti', label: 'Žádosti', icon: <ClipboardCheck aria-hidden />, badge: pending },
        { to: '/admin/profily', label: 'Profily', icon: <UsersRound aria-hidden /> },
        { to: '/admin/rezervace', label: 'Rezervace', icon: <CalendarRange aria-hidden /> },
        { to: '/admin/historie', label: 'Historie změn', icon: <History aria-hidden /> },
      ]}
    />
  );
}
