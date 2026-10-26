import { ChevronRight, MessageSquareText } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getZonedParts, formatDayLong, formatTimeRange } from '../../domain/time';
import type { AppointmentStatus, ISODateTime } from '../../domain/types';
import { Badge } from '../ui/Badge';
import { cn } from '../ui/cn';
import { AppointmentStatusBadge } from '../ui/StatusBadge';

const MONTHS = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];

export function DateBlock({ iso, muted = false }: { iso: ISODateTime; muted?: boolean }) {
  const p = getZonedParts(new Date(iso));
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl leading-none',
        muted ? 'bg-canvas text-muted' : 'bg-sage-100 text-brand-900',
      )}
    >
      <span className="font-display text-xl font-semibold">{p.day}</span>
      <span className="mt-0.5 text-[0.7rem] font-medium uppercase tracking-wide">{MONTHS[p.month - 1]}</span>
    </span>
  );
}

export function AppointmentRow({
  to,
  startsAt,
  durationMinutes,
  title,
  subtitle,
  status,
  feedbackPending = false,
  extra,
}: {
  to?: string;
  startsAt: ISODateTime;
  durationMinutes: number;
  title: string;
  subtitle?: string;
  status: AppointmentStatus;
  feedbackPending?: boolean;
  extra?: ReactNode;
}) {
  const past = status !== 'booked';
  const content = (
    <>
      <DateBlock iso={startsAt} muted={past} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{title}</p>
        <p className="text-sm text-muted">
          <span className="first-letter:uppercase">{formatDayLong(startsAt)}</span>, {formatTimeRange(startsAt, durationMinutes)}
          {subtitle ? ` · ${subtitle}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <AppointmentStatusBadge status={status} />
          {feedbackPending && (
            <Badge tone="blue" icon={<MessageSquareText aria-hidden />}>
              Můžeš vyplnit zpětnou vazbu
            </Badge>
          )}
        </div>
      </div>
      {extra}
      {to && <ChevronRight aria-hidden className="size-5 shrink-0 self-center text-muted" />}
    </>
  );
  const className = 'flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors';
  return to ? (
    <Link to={to} className={cn(className, 'hover:border-brand-300 hover:bg-sage-50')}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
