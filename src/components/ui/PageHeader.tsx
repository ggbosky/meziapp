import type { ReactNode } from 'react';
import { cn } from './cn';

export function PageHeader({ eyebrow, title, description, actions, className }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-sm font-semibold text-brand-700">{eyebrow}</p>}
        <h1 className="font-display text-[1.9rem] font-extrabold leading-tight text-ink sm:text-[2.3rem]">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-base leading-relaxed text-muted">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, description, action, id }: { children: ReactNode; description?: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-xl font-extrabold text-ink">{children}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
