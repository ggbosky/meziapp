import { Check } from 'lucide-react';
import { useId } from 'react';
import { dateKey, formatDayLong, formatRelativeDay, formatTime } from '../../domain/time';
import type { AvailabilitySlot } from '../../domain/types';
import { cn } from '../ui/cn';

/** Volné termíny seskupené podle dne. Výběr funguje jako skupina přepínačů. */
export function SlotPicker({
  slots,
  value,
  onChange,
  now,
  name = 'slot',
}: {
  slots: AvailabilitySlot[];
  value: string | null;
  onChange: (slotId: string) => void;
  now: Date;
  name?: string;
}) {
  const groupId = useId();
  const groups = new Map<string, AvailabilitySlot[]>();
  for (const slot of slots) {
    const key = dateKey(slot.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  }
  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([key, daySlots]) => (
        <fieldset key={key}>
          <legend className="mb-2 text-sm font-semibold text-ink first-letter:uppercase">
            <DayLabel start={daySlots[0]!.startsAt} now={now} />
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {daySlots.map((slot) => {
              const checked = value === slot.id;
              return (
                <label
                  key={slot.id}
                  className={cn(
                    'relative flex min-h-14 cursor-pointer flex-col justify-center rounded-[var(--radius-field)] border px-3.5 py-2 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-700',
                    checked ? 'border-brand-800 bg-brand-800 text-white' : 'border-line-strong bg-surface hover:border-brand-600 hover:bg-sage-50',
                  )}
                >
                  <input
                    type="radio"
                    name={`${name}-${groupId}`}
                    value={slot.id}
                    checked={checked}
                    onChange={() => onChange(slot.id)}
                    className="sr-only"
                  />
                  <span className="text-base font-semibold tabular-nums">{formatTime(slot.startsAt)}</span>
                  <span className={cn('text-xs', checked ? 'text-white/85' : 'text-muted')}>{slot.durationMinutes} minut</span>
                  {checked && <Check aria-hidden className="absolute right-3 top-3 size-4" />}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/** „zítra · úterý 27. října“ nebo jen „čtvrtek 29. října“ */
export function DayLabel({ start, now }: { start: string; now: Date }) {
  const relative = formatRelativeDay(start, now);
  const full = formatDayLong(start);
  return (
    <>
      {relative}
      {relative !== full && <span className="font-normal text-muted"> · {full}</span>}
    </>
  );
}
