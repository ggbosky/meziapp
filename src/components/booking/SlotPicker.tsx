import { useState } from 'react';
import { dateKey, formatDayLong, formatRelativeDay, formatTime, getZonedParts } from '../../domain/time';
import type { AvailabilitySlot } from '../../domain/types';
import { cn } from '../ui/cn';

const WEEKDAYS = ['po', 'út', 'st', 'čt', 'pá', 'so', 'ne'];

/**
 * Výběr termínu jako v aplikaci: vodorovný pás dnů a pod ním časy
 * vybraného dne. Obojí jsou skupiny přepínačů ovladatelné klávesnicí.
 */
export function SlotPicker({
  slots,
  value,
  onChange,
  now,
}: {
  slots: AvailabilitySlot[];
  value: string | null;
  onChange: (slotId: string) => void;
  now: Date;
  name?: string;
}) {
  const days = new Map<string, AvailabilitySlot[]>();
  for (const slot of slots) {
    const key = dateKey(slot.startsAt);
    days.set(key, [...(days.get(key) ?? []), slot]);
  }
  const keys = [...days.keys()];
  const selectedSlot = slots.find((s) => s.id === value);
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const activeDay = (pickedDay && days.has(pickedDay) ? pickedDay : null) ?? (selectedSlot ? dateKey(selectedSlot.startsAt) : null) ?? keys[0];
  const daySlots = activeDay ? (days.get(activeDay) ?? []) : [];

  return (
    <div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-muted">Den</legend>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {keys.map((key) => {
            const first = days.get(key)![0]!;
            const p = getZonedParts(new Date(first.startsAt));
            const checked = key === activeDay;
            return (
              <label
                key={key}
                className={cn(
                  'flex w-[4.25rem] shrink-0 cursor-pointer flex-col items-center rounded-2xl border-2 py-2.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600',
                  checked ? 'border-brand-800 bg-brand-800 text-white' : 'border-line bg-surface text-ink hover:border-brand-300',
                )}
              >
                <input
                  type="radio"
                  name="slot-day"
                  className="sr-only"
                  checked={checked}
                  onChange={() => setPickedDay(key)}
                  aria-label={`${formatRelativeDay(first.startsAt, now)}, ${formatDayLong(first.startsAt)}`}
                />
                <span className={cn('text-xs font-semibold uppercase', checked ? 'text-white/80' : 'text-muted')}>{WEEKDAYS[p.weekday]}</span>
                <span className="font-round text-xl font-extrabold leading-tight">{p.day}</span>
                <span className={cn('mt-0.5 size-1.5 rounded-full', checked ? 'bg-sun' : 'bg-brand-600')} aria-hidden />
              </label>
            );
          })}
        </div>
      </fieldset>
      {activeDay && (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-semibold text-ink first-letter:uppercase">
            {formatRelativeDay(daySlots[0]!.startsAt, now)}
            {formatRelativeDay(daySlots[0]!.startsAt, now) !== formatDayLong(daySlots[0]!.startsAt) && (
              <span className="font-normal text-muted"> · {formatDayLong(daySlots[0]!.startsAt)}</span>
            )}
          </legend>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:grid-cols-3">
            {daySlots.map((slot) => {
              const checked = value === slot.id;
              return (
                <label
                  key={slot.id}
                  className={cn(
                    'flex min-h-14 cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 px-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600',
                    checked ? 'border-brand-700 bg-sage-100' : 'border-line bg-surface hover:border-brand-300',
                  )}
                >
                  <input type="radio" name="slot-time" value={slot.id} checked={checked} onChange={() => onChange(slot.id)} className="sr-only" />
                  <span className="font-round text-lg font-extrabold tabular-nums">{formatTime(slot.startsAt)}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', checked ? 'bg-brand-800 text-white' : 'bg-sage-50 text-muted')}>
                    {slot.durationMinutes} min{slot.format === 'in_person' ? ' · osobně' : ''}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
