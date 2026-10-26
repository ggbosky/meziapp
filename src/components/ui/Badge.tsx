import type { ReactNode } from 'react';
import { cn } from './cn';

export type BadgeTone = 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'outline';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-sage-100 text-brand-900 border-transparent',
  green: 'bg-brand-800 text-white border-transparent',
  amber: 'bg-amber-soft text-amber-ink border-amber-line',
  red: 'bg-danger-soft text-danger-strong border-danger-line',
  blue: 'bg-info-soft text-info-ink border-info-line',
  outline: 'bg-surface text-muted border-line-strong',
};

export function Badge({ tone = 'neutral', icon, children, className }: { tone?: BadgeTone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5 [&_svg]:size-3.5',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
