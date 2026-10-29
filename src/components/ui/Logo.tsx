import { appConfig } from '../../config/app';
import markUrl from '../../assets/brand/mezi-mark.png';
import lockupUrl from '../../assets/brand/mezi-logo.png';
import { cn } from './cn';

/**
 * Logo Mezi. Značka je obrázek z dodaného loga, název se vypisuje
 * z konfigurace, takže přejmenování aplikace logo nerozbije.
 */
export function LogoMark({ className }: { className?: string }) {
  return <img src={markUrl} alt="" aria-hidden width={260} height={187} className={cn('h-8 w-auto select-none', className)} draggable={false} />;
}

export function Logo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={size === 'sm' ? 'h-7' : 'h-9'} />
      <span
        className={cn(
          'font-sans font-semibold uppercase leading-none tracking-[0.12em] text-logo-navy',
          size === 'sm' ? 'text-[1.15rem]' : 'text-[1.35rem]',
        )}
      >
        {appConfig.name}
      </span>
    </span>
  );
}

/** Celé logo (značka a nápis) pro větší plochy. Obsahuje původní nápis MEZI. */
export function LogoLockup({ className }: { className?: string }) {
  return <img src={lockupUrl} alt={`Logo ${appConfig.name}`} width={324} height={310} className={cn('h-auto select-none', className)} draggable={false} />;
}
