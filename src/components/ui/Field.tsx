import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Check, CircleAlert } from 'lucide-react';
import { cn } from './cn';

const control =
  'block w-full rounded-[var(--radius-field)] border bg-surface px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus-visible:outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-700/15 disabled:bg-sage-50 disabled:text-muted';

function controlClass(error?: string) {
  return cn(control, error ? 'border-danger' : 'border-line-strong hover:border-brand-600');
}

interface FieldShellProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  counter?: ReactNode;
}

function FieldShell({ id, label, hint, error, required, children, counter }: FieldShellProps) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {required && <span className="text-muted"> (povinné)</span>}
        </label>
        {counter}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.8rem] leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[0.8rem] font-medium leading-relaxed text-danger-strong">
      <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      {message}
    </p>
  );
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  id?: string;
}

export function TextField({ label, hint, error, id: givenId, required, className, ...rest }: TextFieldProps) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        className={cn(controlClass(error), 'min-h-11', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  id?: string;
  maxChars?: number;
}

export function TextArea({ label, hint, error, id: givenId, required, className, maxChars, value, rows = 4, ...rest }: TextAreaProps) {
  const autoId = useId();
  const id = givenId ?? autoId;
  const length = typeof value === 'string' ? value.trim().length : 0;
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      counter={
        maxChars ? (
          <span className={cn('text-xs tabular-nums', length > maxChars ? 'font-medium text-danger-strong' : 'text-muted')} aria-live="polite">
            {length} / {maxChars}
          </span>
        ) : undefined
      }
    >
      <textarea
        id={id}
        rows={rows}
        value={value}
        className={cn(controlClass(error), 'resize-y leading-relaxed', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        required={required}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  id?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export function SelectField({ label, hint, error, id: givenId, options, className, ...rest }: SelectFieldProps) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        className={cn(
          controlClass(error),
          'min-h-11 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%2355665c%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")] bg-[length:1.1rem] bg-[right_0.8rem_center] bg-no-repeat pr-10',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface ChoiceGroupProps<T extends string> {
  legend: ReactNode;
  hint?: ReactNode;
  error?: string;
  options: ReadonlyArray<{ value: T; label: string; description?: string }>;
  required?: boolean;
  name: string;
}

/** Skupina zaškrtávacích políček ve tvaru čipů. */
export function ChipCheckboxGroup<T extends string>({
  legend,
  hint,
  error,
  options,
  required,
  name,
  value,
  onChange,
}: ChoiceGroupProps<T> & { value: T[]; onChange: (value: T[]) => void }) {
  const id = useId();
  return (
    <fieldset aria-describedby={describedBy(id, hint, error)} aria-invalid={error ? true : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-ink">
        {legend}
        {required && <span className="text-muted"> (povinné)</span>}
      </legend>
      {hint && !error && (
        <p id={`${id}-hint`} className="-mt-0.5 mb-2 text-[0.8rem] text-muted">
          {hint}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                'relative inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-700',
                checked ? 'border-brand-800 bg-brand-800 text-white' : 'border-line-strong bg-surface text-ink hover:border-brand-600',
              )}
            >
              <input
                type="checkbox"
                name={name}
                className="sr-only"
                checked={checked}
                onChange={(e) => onChange(e.target.checked ? [...value, option.value] : value.filter((v) => v !== option.value))}
              />
              {checked && <Check aria-hidden className="size-3.5" />}
              {option.label}
            </label>
          );
        })}
      </div>
      {error && <FieldError id={`${id}-error`} message={error} />}
    </fieldset>
  );
}

/** Skupina přepínačů jako karty. */
export function RadioCardGroup<T extends string>({
  legend,
  hint,
  error,
  options,
  name,
  value,
  onChange,
  columns = 2,
}: ChoiceGroupProps<T> & { value: T | null; onChange: (value: T) => void; columns?: 2 | 3 }) {
  const id = useId();
  return (
    <fieldset aria-describedby={describedBy(id, hint, error)}>
      <legend className="mb-2 text-sm font-medium text-ink">{legend}</legend>
      <div className={cn('grid gap-2', columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--radius-field)] border p-3.5 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-700',
                checked ? 'border-brand-700 bg-sage-50 ring-1 ring-brand-700' : 'border-line-strong bg-surface hover:border-brand-600',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-0.5 size-4 shrink-0 accent-brand-800"
              />
              <span>
                <span className="block font-medium text-ink">{option.label}</span>
                {option.description && <span className="mt-0.5 block text-[0.8rem] leading-relaxed text-muted">{option.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.8rem] text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </fieldset>
  );
}

export function Checkbox({ label, checked, onChange, description, id: givenId }: { label: ReactNode; checked: boolean; onChange: (checked: boolean) => void; description?: ReactNode; id?: string }) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-brand-800"
        aria-describedby={description ? `${id}-desc` : undefined}
      />
      <div className="text-sm leading-relaxed">
        <label htmlFor={id} className="cursor-pointer text-ink">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-[0.8rem] text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
