import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cn } from './cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

const tones: Record<AlertTone, { box: string; icon: ReactNode; label: string }> = {
  info: { box: 'bg-info-soft border-info-line text-info-ink', icon: <Info aria-hidden />, label: 'Informace' },
  success: { box: 'bg-sage-100 border-brand-200 text-brand-900', icon: <CircleCheck aria-hidden />, label: 'Hotovo' },
  warning: { box: 'bg-amber-soft border-amber-line text-amber-ink', icon: <TriangleAlert aria-hidden />, label: 'Upozornění' },
  error: { box: 'bg-danger-soft border-danger-line text-danger-strong', icon: <CircleAlert aria-hidden />, label: 'Chyba' },
};

interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** role="alert" pro chyby, které vznikly akcí uživatele. */
  live?: boolean;
  action?: ReactNode;
}

export function Alert({ tone = 'info', title, children, className, live = false, action }: AlertProps) {
  const t = tones[tone];
  return (
    <div
      role={live ? (tone === 'error' ? 'alert' : 'status') : undefined}
      className={cn('flex gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-relaxed [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0', t.box, className)}
    >
      {t.icon}
      <div className="min-w-0 flex-1">
        <span className="sr-only">{t.label}: </span>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(Boolean(title) && 'mt-0.5', 'text-ink/85 [&_a]:font-medium')}>{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}
