import {
  CalendarClock,
  CalendarHeart,
  ClipboardCheck,
  ClipboardList,
  FileText,
  HandHeart,
  History,
  House,
  Info,
  LayoutDashboard,
  LifeBuoy,
  Search,
  UserRound,
  UsersRound,
  CalendarRange,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCurrentUser, useDemoSnapshot, useServices } from '../../app/AppContext';
import { appConfig } from '../../config/app';
import { initials } from '../../domain/text';
import { cn } from '../ui/cn';
import { Logo } from '../ui/Logo';
import { ResetDemoButton } from './ResetDemoButton';
import { ROLE_LABEL } from './roleHome';

export interface NavItem {
  to: string;
  label: string;
  /** Kratší popisek pro dolní lištu na telefonu. */
  short?: string;
  icon: ReactNode;
  end?: boolean;
  badge?: number;
}

/** Navigace podle role demo účtu. Prvních nejvýš pět položek tvoří dolní lištu. */
export function useNavItems(): { primary: NavItem[]; secondary: NavItem[] } {
  const user = useCurrentUser();
  const { profiles, admin } = useServices();
  useDemoSnapshot();
  const account: NavItem = { to: '/vyzkouset', label: 'Účet a demo režim', short: 'Účet', icon: <UserRound aria-hidden /> };
  const help: NavItem = { to: '/nalehava-pomoc', label: 'Naléhavá pomoc', short: 'Pomoc', icon: <LifeBuoy aria-hidden /> };
  const about: NavItem = { to: '/o-prototypu', label: 'O prototypu', icon: <Info aria-hidden /> };
  const browse: NavItem = { to: '/psychologove', label: 'Psychologové', short: 'Hledat', icon: <Search aria-hidden /> };
  const forPros: NavItem = { to: '/pro-odborniky', label: 'Pro odborníky', short: 'Odborníci', icon: <HandHeart aria-hidden /> };
  const home: NavItem = { to: '/', label: 'Domů', icon: <House aria-hidden />, end: true };

  if (user?.role === 'client') {
    return {
      primary: [home, browse, { to: '/klient', label: 'Moje termíny', short: 'Termíny', icon: <CalendarHeart aria-hidden /> }, help, account],
      secondary: [forPros, about],
    };
  }
  if (user?.role === 'professional') {
    if (profiles.getOwnStatus()?.kind === 'approved') {
      return {
        primary: [
          { to: '/odbornik', label: 'Přehled', icon: <LayoutDashboard aria-hidden />, end: true },
          { to: '/odbornik/terminy', label: 'Termíny', icon: <CalendarClock aria-hidden /> },
          { to: '/odbornik/konzultace', label: 'Konzultace', icon: <ClipboardList aria-hidden /> },
          { to: '/odbornik/profil', label: 'Můj profil', short: 'Profil', icon: <UserRound aria-hidden /> },
          { ...account, icon: <span aria-hidden className="text-[0.7rem] font-bold">{initials(user.displayName)}</span> },
        ],
        secondary: [{ to: '/odbornik/prihlaska', label: 'Přihláška', icon: <FileText aria-hidden /> }, browse, help, about],
      };
    }
    return {
      primary: [home, { to: '/odbornik/prihlaska', label: 'Přihláška', icon: <FileText aria-hidden /> }, browse, help, account],
      secondary: [forPros, about],
    };
  }
  if (user?.role === 'admin') {
    const pending = admin.listApplications().filter((a) => a.status === 'submitted').length;
    return {
      primary: [
        { to: '/admin', label: 'Přehled', icon: <LayoutDashboard aria-hidden />, end: true },
        { to: '/admin/zadosti', label: 'Žádosti', icon: <ClipboardCheck aria-hidden />, badge: pending },
        { to: '/admin/profily', label: 'Profily', icon: <UsersRound aria-hidden /> },
        { to: '/admin/rezervace', label: 'Rezervace', icon: <CalendarRange aria-hidden /> },
        account,
      ],
      secondary: [{ to: '/admin/historie', label: 'Historie změn', icon: <History aria-hidden /> }, browse, about],
    };
  }
  return { primary: [home, browse, forPros, help, account], secondary: [about] };
}

function Badge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-peach px-1.5 text-[0.7rem] font-bold leading-5 text-ink">
      {count}
      <span className="sr-only"> ke zpracování</span>
    </span>
  );
}

/** Boční panel na počítači. */
export function Sidebar() {
  const { primary, secondary } = useNavItems();
  const user = useCurrentUser();
  const item = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-11 items-center gap-3 rounded-2xl px-3 text-[0.95rem] font-semibold transition-colors [&_svg]:size-5',
      isActive ? 'bg-sage-100 text-brand-800' : 'text-muted hover:bg-sage-50 hover:text-ink',
    );
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
      <Link to="/" className="mb-6 rounded-xl px-2" aria-label={`${appConfig.name}, domů`}>
        <Logo />
      </Link>
      <nav aria-label="Hlavní navigace" className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <ul className="space-y-1">
          {primary.map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} end={n.end} className={item}>
                <span className="flex size-5 items-center justify-center">{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                <Badge count={n.badge} />
              </NavLink>
            </li>
          ))}
        </ul>
        {secondary.length > 0 && (
          <ul className="space-y-1 border-t border-line pt-4">
            {secondary.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} end={n.end} className={item}>
                  <span className="flex size-5 items-center justify-center">{n.icon}</span>
                  <span className="flex-1">{n.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>
      <div className="mt-4 space-y-3 border-t border-line pt-4">
        {user ? (
          <Link to="/vyzkouset" className="flex items-center gap-3 rounded-2xl p-2 hover:bg-sage-50">
            <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-sun-soft font-round text-sm font-extrabold text-ink">
              {initials(user.displayName)}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold">{user.displayName}</span>
              <span className="block text-xs text-muted">Demo účet · {ROLE_LABEL[user.role]}</span>
            </span>
          </Link>
        ) : (
          <Link
            to="/vyzkouset"
            className="flex min-h-11 items-center justify-center rounded-[14px] bg-brand-800 px-4 text-sm font-semibold text-white hover:bg-brand-900"
          >
            Vyzkoušet aplikaci
          </Link>
        )}
        <ResetDemoButton size="sm" variant="ghost" className="w-full" />
      </div>
    </aside>
  );
}

/** Horní lišta na telefonu. */
export function MobileTopBar() {
  const user = useCurrentUser();
  return (
    <div className="sticky top-0 z-30 border-b border-line/70 bg-canvas/90 backdrop-blur-md lg:hidden">
      <div className="container-page flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center rounded-xl" aria-label={`${appConfig.name}, domů`}>
          <Logo size="sm" />
        </Link>
        <Link
          to="/vyzkouset"
          className="flex min-h-10 items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3 text-sm font-semibold shadow-soft"
        >
          <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-sun-soft font-round text-xs font-extrabold">
            {user ? initials(user.displayName) : <UserRound className="size-4" />}
          </span>
          {user ? ROLE_LABEL[user.role] : 'Vyzkoušet'}
        </Link>
      </div>
    </div>
  );
}

/** Dolní lišta s kartami na telefonu. */
export function BottomTabs() {
  const { primary } = useNavItems();
  return (
    <nav
      aria-label="Hlavní navigace"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${primary.length}, minmax(0, 1fr))` }}>
        {primary.map((n) => (
          <li key={n.to}>
            <NavLink
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn('group flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[0.7rem] font-semibold', isActive ? 'text-brand-800' : 'text-muted')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'relative flex h-8 w-14 items-center justify-center rounded-full transition-colors [&_svg]:size-[1.35rem]',
                      isActive ? 'bg-sage-100' : 'group-hover:bg-sage-50',
                    )}
                  >
                    {n.icon}
                    {n.badge ? (
                      <span className="absolute -right-0.5 -top-1">
                        <Badge count={n.badge} />
                      </span>
                    ) : null}
                  </span>
                  <span className="max-w-full truncate">{n.short ?? n.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
