import type { ReactNode } from 'react';
import { cn } from './cn';

export function EmptyState({ icon, title, children, action, className }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center', className)}>
      {icon && <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-sage-100 text-brand-800 [&_svg]:size-6">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {children && <div className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
