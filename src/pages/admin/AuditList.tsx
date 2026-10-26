import { Ban, CircleCheck, CirclePause, CirclePlay, FileQuestion, StickyNote } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatTimestamp } from '../../domain/time';
import type { AuditAction, AuditEvent } from '../../domain/types';

const ICONS: Record<AuditAction, { icon: ReactNode; label: string }> = {
  application_approved: { icon: <CircleCheck aria-hidden />, label: 'Schválení přihlášky' },
  application_changes_requested: { icon: <FileQuestion aria-hidden />, label: 'Žádost o doplnění' },
  application_rejected: { icon: <Ban aria-hidden />, label: 'Zamítnutí přihlášky' },
  application_note_updated: { icon: <StickyNote aria-hidden />, label: 'Interní poznámka' },
  profile_suspended: { icon: <CirclePause aria-hidden />, label: 'Pozastavení profilu' },
  profile_reactivated: { icon: <CirclePlay aria-hidden />, label: 'Obnovení profilu' },
};

export function AuditList({ events, actorName }: { events: AuditEvent[]; actorName: (id: string) => string }) {
  if (events.length === 0) return <p className="text-sm text-muted">Zatím žádné změny.</p>;
  return (
    <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[1.1rem] before:top-2 before:w-px before:bg-line">
      {events.map((event) => {
        const meta = ICONS[event.action];
        return (
          <li key={event.id} className="relative flex gap-4">
            <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-brand-700 [&_svg]:size-4">
              {meta.icon}
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-medium text-ink">{meta.label}</p>
              <p className="mt-0.5 break-words text-sm leading-relaxed text-ink/85">{event.summary}</p>
              <p className="mt-0.5 text-xs text-muted">
                <time dateTime={event.at}>{formatTimestamp(event.at)}</time> · {actorName(event.actorId)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
