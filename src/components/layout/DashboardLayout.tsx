import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageSkeleton } from '../feedback/PageSkeleton';

/** Obal sekcí pro odborníky a administraci. Navigaci obstarává společná kostra aplikace. */
export function DashboardLayout() {
  return (
    <div className="container-page animate-enter py-6 sm:py-10">
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
