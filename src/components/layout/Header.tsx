import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu, Repeat, X } from 'lucide-react';
import { useCurrentUser, useServices } from '../../app/AppContext';
import { initials } from '../../domain/text';
import { ButtonLink } from '../ui/Button';
import { cn } from '../ui/cn';
import { Logo } from '../ui/Logo';
import { homeFor, ROLE_LABEL } from './roleHome';

const NAV = [
  { to: '/psychologove', label: 'Psychologové' },
  { to: '/pro-odborniky', label: 'Pro odborníky' },
  { to: '/nalehava-pomoc', label: 'Naléhavá pomoc' },
  { to: '/o-prototypu', label: 'O prototypu' },
];

function AccountMenu() {
  const user = useCurrentUser();
  const { session } = useServices();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const item = 'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-ink hover:bg-sage-100 [&_svg]:size-4 [&_svg]:text-brand-700';
  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 items-center gap-2.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-left hover:border-brand-600"
      >
        <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-sage-100 text-sm font-semibold text-brand-900">
          {initials(user.displayName)}
        </span>
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block max-w-[11rem] truncate text-sm font-medium text-ink">{user.displayName}</span>
          <span className="block text-xs text-muted">Demo účet · {ROLE_LABEL[user.role]}</span>
        </span>
        <span className="sr-only sm:hidden">Demo účet {user.displayName}</span>
        <ChevronDown aria-hidden className={cn('size-4 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 animate-enter rounded-2xl border border-line bg-surface p-1.5 shadow-raised">
          <p className="px-3 pb-1.5 pt-2 text-xs text-muted">
            Přihlášen(a) jako <strong className="font-medium text-ink">{user.displayName}</strong>
          </p>
          <Link to={homeFor(user)} className={item} onClick={() => setOpen(false)}>
            <LayoutDashboard aria-hidden /> Můj přehled
          </Link>
          <Link to="/vyzkouset" className={item} onClick={() => setOpen(false)}>
            <Repeat aria-hidden /> Přepnout demo účet
          </Link>
          <button
            type="button"
            className={item}
            onClick={async () => {
              setOpen(false);
              await session.signOut();
              navigate('/');
            }}
          >
            <LogOut aria-hidden /> Odejít z demo účtu
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const user = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'inline-flex min-h-11 items-center rounded-full px-3.5 text-[0.93rem] font-medium transition-colors',
      isActive ? 'bg-sage-100 text-brand-900' : 'text-muted hover:bg-sage-50 hover:text-ink',
    );

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/95 backdrop-blur-sm supports-[backdrop-filter]:bg-canvas/85">
      <div className="container-page flex h-[4.25rem] items-center justify-between gap-3">
        <Link to="/" className="rounded-lg" aria-label="Úvodní stránka">
          <Logo />
        </Link>
        <nav aria-label="Hlavní navigace" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} className={navLink}>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <AccountMenu />
          ) : (
            <ButtonLink to="/vyzkouset" size="sm">
              Vyzkoušet aplikaci
            </ButtonLink>
          )}
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-sage-100 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
            <span className="sr-only">{mobileOpen ? 'Zavřít menu' : 'Otevřít menu'}</span>
          </button>
        </div>
      </div>
      <nav id="mobile-nav" aria-label="Hlavní navigace" hidden={!mobileOpen} className="border-t border-line bg-canvas lg:hidden">
        <ul className="container-page flex flex-col gap-1 py-3">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} className={({ isActive }) => cn(navLink({ isActive }), 'w-full rounded-xl')}>
                {n.label}
              </NavLink>
            </li>
          ))}
          <li className="mt-2 border-t border-line pt-3">
            {user ? (
              <ButtonLink to={homeFor(user)} variant="secondary" className="w-full">
                Můj přehled
              </ButtonLink>
            ) : (
              <ButtonLink to="/vyzkouset" className="w-full">
                Vyzkoušet aplikaci
              </ButtonLink>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
