import { Check } from 'lucide-react';
import { cn } from './cn';

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Kroky rezervace">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="min-w-0" aria-current={active ? 'step' : undefined}>
            <div className={cn('h-1.5 rounded-full transition-colors', done || active ? 'bg-brand-700' : 'bg-line')} />
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-semibold',
                  done ? 'bg-brand-700 text-white' : active ? 'bg-brand-800 text-white' : 'bg-sage-100 text-muted',
                )}
                aria-hidden
              >
                {done ? <Check className="size-3" /> : index + 1}
              </span>
              <span className={cn('truncate text-xs sm:text-sm', active ? 'font-semibold text-ink' : 'text-muted')}>
                {label}
                <span className="sr-only">{done ? ' (hotovo)' : active ? ' (aktuální krok)' : ''}</span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
