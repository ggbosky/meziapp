import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DemoBanner } from './DemoBanner';
import { Footer } from './Footer';
import { Header } from './Header';

/** Po změně stránky posune obsah nahoru a přesune focus na hlavní obsah. */
function useRouteFocus() {
  const location = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [location.pathname, location.hash]);
}

export function AppShell() {
  useRouteFocus();
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only z-[70] rounded-full bg-brand-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Přeskočit na obsah
      </a>
      <DemoBanner />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
