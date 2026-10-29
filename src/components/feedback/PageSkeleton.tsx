/** Kostra stránky během načítání části aplikace (obdoba loading.js v Next.js). */
export function PageSkeleton() {
  const block = 'rounded-[var(--radius-card)] bg-line/70 motion-safe:animate-pulse';
  return (
    <div className="container-page py-6 sm:py-10" role="status" aria-live="polite">
      <span className="sr-only">Načítáme stránku…</span>
      <div aria-hidden className="space-y-4">
        <div className="h-4 w-32 rounded-full bg-line/70 motion-safe:animate-pulse" />
        <div className="h-9 w-2/3 max-w-sm rounded-xl bg-line/70 motion-safe:animate-pulse" />
        <div className="grid grid-cols-3 gap-2.5">
          <div className={`${block} h-24`} />
          <div className={`${block} h-24`} />
          <div className={`${block} h-24`} />
        </div>
        <div className={`${block} h-40`} />
        <div className={`${block} h-28`} />
      </div>
    </div>
  );
}
