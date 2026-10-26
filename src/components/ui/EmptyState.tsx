import type { ReactNode } from 'react';
import { cn } from './cn';
import { CalendarIllustration } from './Illustrations';

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  /** Zachováno kvůli kompatibilitě; prázdné stavy používají jednotnou ilustraci. */
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-[var(--radius-card)] bg-surface px-6 py-8 text-center shadow-soft', className)}>
      <CalendarIllustration className="mb-3 w-32" />
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      {children && <div className="mt-1.5 max-w-md text-[0.95rem] leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
