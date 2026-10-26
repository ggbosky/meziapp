import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button, type ButtonVariant } from './Button';
import { cn } from './cn';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Prvek, který dostane focus po otevření. Jinak první ovládací prvek. */
  initialFocus?: RefObject<HTMLElement | null>;
  icon?: ReactNode;
  tone?: 'default' | 'danger';
}

/**
 * Modální dialog: drží focus uvnitř, zavírá se Escapem a po zavření vrací
 * focus na prvek, který ho otevřel.
 */
export function Dialog({ open, onClose, title, description, children, footer, initialFocus, icon, tone = 'default' }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const target = initialFocus?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    target?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, initialFocus]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-brand-950/40" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full animate-dialog flex-col overflow-hidden rounded-t-[28px] bg-surface pb-[env(safe-area-inset-bottom,0px)] shadow-raised sm:max-w-lg sm:rounded-[24px]"
      >
        <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line-strong sm:hidden" />
        <div className="flex items-start gap-3 px-5 pb-2 pt-4 sm:px-6 sm:pt-6">
          {icon && (
            <span
              className={cn(
                'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5',
                tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-sage-100 text-brand-800',
              )}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-xl font-extrabold leading-snug text-ink">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-sm leading-relaxed text-muted">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sage-100 hover:text-ink"
            aria-label="Zavřít dialog"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        {children && <div className="overflow-y-auto px-5 py-3 text-sm leading-relaxed text-ink sm:px-6">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 px-5 pb-5 pt-3 sm:flex-row sm:justify-end sm:px-6">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
  confirmDisabled?: boolean;
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Zpět',
  variant = 'primary',
  loading = false,
  icon,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      initialFocus={cancelRef}
      icon={icon}
      tone={variant === 'danger' ? 'danger' : 'default'}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
