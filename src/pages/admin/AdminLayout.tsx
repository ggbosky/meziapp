import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RequireRole } from '../../components/layout/RequireRole';

export function AdminLayout() {
  return (
    <RequireRole role="admin">
      <DashboardLayout />
    </RequireRole>
  );
}
