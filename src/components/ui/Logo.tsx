import { appConfig } from '../../config/app';
import { cn } from './cn';

/** Abstraktní symbol: dva prolínající se kruhy — dva lidé, mezi nimiž vzniká prostor. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
      <rect width="32" height="32" rx="10" fill="#22644A" />
      <circle cx="12.5" cy="16" r="6.5" fill="none" stroke="#FFFFFF" strokeWidth="2.4" />
      <circle cx="19.5" cy="16" r="6.5" fill="none" stroke="#FFD46E" strokeWidth="2.4" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-round text-[1.45rem] font-extrabold tracking-tight text-brand-900">{appConfig.name}</span>
    </span>
  );
}
