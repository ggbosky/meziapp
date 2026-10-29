import { useId } from 'react';
import { citiesByRegion } from '../../domain/places';
import { cn } from '../ui/cn';
import { FieldError } from '../ui/Field';

/** Výběr nejbližšího většího města, seskupený podle krajů. */
export function CitySelect({
  label,
  value,
  onChange,
  hint,
  error,
  emptyLabel = 'Neuvádět',
  id: givenId,
}: {
  label: string;
  value: string | null;
  onChange: (cityId: string | null) => void;
  hint?: string;
  error?: string;
  emptyLabel?: string;
  id?: string;
}) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          'block min-h-12 w-full appearance-none rounded-[var(--radius-field)] border-2 bg-sage-50 bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%2355665c%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")] bg-[length:1.1rem] bg-[right_0.9rem_center] bg-no-repeat px-4 pr-10 text-base text-ink focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-600/15',
          error ? 'border-danger' : 'border-line hover:border-brand-300',
        )}
      >
        <option value="">{emptyLabel}</option>
        {citiesByRegion().map((group) => (
          <optgroup key={group.region} label={group.region}>
            {group.cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.8rem] leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}
