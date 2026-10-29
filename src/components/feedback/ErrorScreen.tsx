import { House, RefreshCw, RotateCcw } from 'lucide-react';
import { appConfig } from '../../config/app';

/**
 * Chybová obrazovka. Záměrně nepoužívá router ani služby aplikace,
 * aby fungovala i ve chvíli, kdy spadla jejich inicializace.
 */
export function ErrorScreen({ error, reset, fullPage = false }: { error: Error; reset?: () => void; fullPage?: boolean }) {
  const resetDemoData = () => {
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith(appConfig.storageKey)) window.localStorage.removeItem(key);
      }
    } catch {
      // Úložiště může být zablokované; stránku i tak načteme znovu.
    }
    window.location.hash = '#/';
    window.location.reload();
  };
  const button =
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] px-5 font-semibold transition-colors [&_svg]:size-4';

  return (
    <div className={fullPage ? 'flex min-h-dvh items-center justify-center bg-canvas p-4' : 'container-page py-10'}>
      <div role="alert" className="mx-auto w-full max-w-lg rounded-[var(--radius-card)] bg-surface p-6 text-center shadow-soft sm:p-8">
        <div aria-hidden className="mx-auto flex size-14 items-center justify-center rounded-full bg-sun-soft font-round text-2xl font-extrabold text-amber-ink">
          !
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Tady se něco pokazilo</h1>
        <p className="mt-2 leading-relaxed text-muted">
          Omlouváme se. Zkus to prosím znovu. Pokud chyba přetrvá, obnov demo data: smažou se jen ukázkové změny v tomto prohlížeči.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {reset ? (
            <button type="button" onClick={reset} className={`${button} bg-brand-800 text-white hover:bg-brand-900`}>
              <RefreshCw aria-hidden /> Zkusit znovu
            </button>
          ) : (
            <button type="button" onClick={() => window.location.reload()} className={`${button} bg-brand-800 text-white hover:bg-brand-900`}>
              <RefreshCw aria-hidden /> Načíst znovu
            </button>
          )}
          <button type="button" onClick={resetDemoData} className={`${button} border-2 border-line bg-surface text-brand-900 hover:bg-sage-50`}>
            <RotateCcw aria-hidden /> Obnovit demo data
          </button>
        </div>
        <a href="#/" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
          <House aria-hidden className="size-4" /> Na úvodní stránku
        </a>
        <details className="mt-4 text-left text-xs text-muted">
          <summary className="cursor-pointer">Technické podrobnosti</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-canvas p-3">{error.message}</pre>
        </details>
      </div>
    </div>
  );
}
