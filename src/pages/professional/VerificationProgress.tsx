import { CircleCheck, CircleDashed, CircleX } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { cn } from '../../components/ui/cn';
import type { VerificationCheck, VerificationItem } from '../../domain/types';
import { VERIFICATION_INFO, VERIFICATION_ITEMS, verifiedCount } from '../../domain/verification';

const STATUS = {
  verified: { label: 'Ověřeno', icon: <CircleCheck aria-hidden />, className: 'bg-sage-100 text-brand-800' },
  rejected: { label: 'Nesouhlasí', icon: <CircleX aria-hidden />, className: 'bg-danger-soft text-danger-strong' },
  pending: { label: 'Čeká na ověření', icon: <CircleDashed aria-hidden />, className: 'bg-canvas text-muted' },
} as const;

/** Přehled ověření pro žadatele: co už administrace ověřila a co ještě ne. */
export function VerificationProgress({ verification }: { verification: Record<VerificationItem, VerificationCheck> }) {
  const done = verifiedCount(verification);
  return (
    <Card as="section" aria-labelledby="progress-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="progress-title" className="text-xl font-extrabold">
          Ověření odbornosti
        </h2>
        <p className="text-sm font-semibold text-muted">
          Ověřeno {done} ze {VERIFICATION_ITEMS.length}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${(done / VERIFICATION_ITEMS.length) * 100}%` }} />
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {VERIFICATION_ITEMS.map((item) => {
          const s = STATUS[verification[item].status];
          return (
            <li key={item} className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-4 py-3">
              <span className="font-semibold">{VERIFICATION_INFO[item].title}</span>
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5', s.className)}>
                {s.icon}
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Profil se klientům zobrazí, až budou ověřené všechny body. V prototypu je ověření simulované.</p>
    </Card>
  );
}

export { STATUS as VERIFICATION_STATUS_STYLE };
