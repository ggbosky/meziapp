import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabs, MobileTopBar, Sidebar } from './AppNav';
import { DemoBanner } from './DemoBanner';
import { Footer } from './Footer';

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

/**
 * Kostra aplikace: na telefonu horní lišta a dolní karty, na počítači
 * boční panel. Ukázkový režim je označený na každé obrazovce.
 */
export function AppShell() {
  useRouteFocus();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
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
      <Sidebar />
      <div className="flex min-h-dvh min-w-0 flex-col">
        <DemoBanner />
        <MobileTopBar />
        <main id="main" tabIndex={-1} className="flex-1 pb-28 outline-none lg:pb-0">
          <Outlet />
        </main>
        <Footer />
      </div>
      <BottomTabs />
    </div>
  );
}
