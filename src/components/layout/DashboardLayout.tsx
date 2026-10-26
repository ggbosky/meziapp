import { Outlet } from 'react-router-dom';

/** Obal sekcí pro odborníky a administraci. Navigaci obstarává společná kostra aplikace. */
export function DashboardLayout() {
  return (
    <div className="container-page animate-enter py-6 sm:py-10">
      <Outlet />
    </div>
  );
}
