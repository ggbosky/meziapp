import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../ui/cn';

export interface DashboardNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
  badge?: number;
}

/** Rozvržení přehledů: boční navigace na desktopu, vodorovná na mobilu. */
export function DashboardLayout({ title, subtitle, nav }: { title: string; subtitle?: ReactNode; nav: DashboardNavItem[] }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors lg:rounded-xl lg:px-3 [&_svg]:size-[1.1rem]',
      isActive ? 'bg-brand-800 text-white lg:bg-sage-100 lg:text-brand-900' : 'text-muted hover:bg-sage-100 hover:text-ink',
    );
  return (
    <div className="container-page py-6 sm:py-10 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <aside className="mb-6 lg:mb-0">
        <div className="mb-3 hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{title}</p>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        <nav aria-label={title} className="-mx-4 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:overflow-visible lg:px-0">
          <ul className="flex gap-1.5 lg:flex-col lg:gap-1">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={linkClass}>
                  {item.icon}
                  <span className="lg:flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber-ink">
                      {item.badge}
                      <span className="sr-only"> ke zpracování</span>
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="min-w-0 animate-enter">
        <Outlet />
      </div>
    </div>
  );
}
