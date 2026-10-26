import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { addDaysToKey, dateKey, formatDayKeyLong, formatDayKeyShort, formatTimeRange, weekStartKey } from '../../domain/time';
import type { OwnSlotView } from '../../services/types';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';
import { slotStateLabel } from './SlotStateBadge';

const STATE_STYLE: Record<OwnSlotView['state'], string> = {
  open: 'border-line-strong bg-surface text-ink border-dashed',
  booked: 'border-brand-800 bg-brand-800 text-white',
  withdrawn: 'border-amber-line bg-amber-soft text-amber-ink line-through decoration-amber-ink/40',
  past: 'border-line bg-canvas text-muted',
};

/** Týdenní rozvrh termínů odborníka. Stav termínu je vždy vypsaný i textem. */
export function WeekSchedule({ slots, now }: { slots: OwnSlotView[]; now: Date }) {
  const todayKey = dateKey(now);
  const [weekStart, setWeekStart] = useState(() => weekStartKey(todayKey));
  const days = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStart, i));
  const byDay = new Map<string, OwnSlotView[]>();
  for (const view of slots) {
    const key = dateKey(view.slot.startsAt);
    if (key >= days[0]! && key <= days[6]!) byDay.set(key, [...(byDay.get(key) ?? []), view]);
  }
  const visibleCount = [...byDay.values()].reduce((sum, list) => sum + list.filter((v) => v.state !== 'withdrawn').length, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink" aria-live="polite">
          Týden {formatDayKeyShort(days[0]!)} – {formatDayKeyShort(days[6]!)}
        </p>
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setWeekStart(addDaysToKey(weekStart, -7))} aria-label="Předchozí týden">
            <ChevronLeft aria-hidden className="size-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setWeekStart(weekStartKey(todayKey))} disabled={weekStart === weekStartKey(todayKey)}>
            Tento týden
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setWeekStart(addDaysToKey(weekStart, 7))} aria-label="Další týden">
            <ChevronRight aria-hidden className="size-4" />
          </Button>
        </div>
      </div>
      <ol className="grid gap-2 xl:grid-cols-7">
        {days.map((key) => {
          const list = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <li
              key={key}
              className={cn(
                'flex min-w-0 gap-3 rounded-2xl border p-3 xl:min-h-36 xl:flex-col xl:gap-2',
                isToday ? 'border-brand-600 bg-sage-50' : 'border-line bg-surface',
              )}
            >
              <h3 className="w-20 shrink-0 text-sm xl:w-auto">
                <span className="font-semibold capitalize">{formatDayKeyShort(key).split(' ')[0]}</span>{' '}
                <span className="text-muted">{formatDayKeyShort(key).split(' ').slice(1).join(' ')}</span>
                {isToday && <span className="block text-xs font-medium text-brand-700">dnes</span>}
                <span className="sr-only">{formatDayKeyLong(key)}</span>
              </h3>
              {list.length === 0 ? (
                <p className="self-center text-xs text-muted xl:self-start">Bez termínů</p>
              ) : (
                <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5 xl:w-full xl:flex-none xl:flex-col">
                  {list.map((view) => (
                    <li key={view.slot.id} className={cn('min-w-0 rounded-xl border px-2.5 py-1.5 text-xs xl:w-full xl:px-2', STATE_STYLE[view.state])}>
                      <span className="block whitespace-nowrap font-semibold tabular-nums">{formatTimeRange(view.slot.startsAt, view.slot.durationMinutes)}</span>
                      <span className="block truncate opacity-90">
                        {slotStateLabel(view, now)}
                        {view.clientLabel && view.state === 'booked' ? ` · ${view.clientLabel}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      {visibleCount === 0 && <p className="mt-3 text-sm text-muted">V tomto týdnu nemáš vypsané žádné termíny.</p>}
    </div>
  );
}
