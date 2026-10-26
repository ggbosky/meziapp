import { appConfig } from '../../config/app';
import { cn } from './cn';

/** Abstraktní symbol: dva prolínající se kruhy — dva lidé, mezi nimiž vzniká prostor. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
      <rect width="32" height="32" rx="9" fill="#245C48" />
      <circle cx="12.5" cy="16" r="6.5" fill="none" stroke="#E7EFE8" strokeWidth="2.4" />
      <circle cx="19.5" cy="16" r="6.5" fill="none" stroke="#9CC5AE" strokeWidth="2.4" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-[1.35rem] font-semibold tracking-tight text-brand-900">{appConfig.name}</span>
    </span>
  );
}
