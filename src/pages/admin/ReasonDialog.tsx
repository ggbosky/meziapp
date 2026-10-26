import { useState, type ReactNode } from 'react';
import type { Result } from '../../domain/result';
import { ADMIN_MESSAGE_LIMITS } from '../../domain/validation';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { TextArea } from '../../components/ui/Field';
import type { ButtonVariant } from '../../components/ui/Button';

/** Dialog s povinným textem (zpráva žadateli, důvod pozastavení…). */
export function ReasonDialog({
  open,
  onClose,
  title,
  description,
  label,
  hint,
  confirmLabel,
  variant = 'primary',
  icon,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  label: string;
  hint?: string;
  confirmLabel: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  onSubmit: (text: string) => Promise<Result<unknown>>;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const close = () => {
    setText('');
    setError(null);
    onClose();
  };
  return (
    <ConfirmDialog
      open={open}
      onCancel={close}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      variant={variant}
      icon={icon}
      loading={pending}
      onConfirm={async () => {
        if (pending) return;
        if (text.trim().length < ADMIN_MESSAGE_LIMITS.min) {
          setError(`Napiš prosím aspoň ${ADMIN_MESSAGE_LIMITS.min} znaků.`);
          return;
        }
        setPending(true);
        const result = await onSubmit(text);
        setPending(false);
        if (result.ok) close();
        else setError(result.error.fieldErrors?.message ?? result.error.message);
      }}
    >
      <TextArea label={label} hint={hint} value={text} onChange={(e) => setText(e.target.value)} maxChars={ADMIN_MESSAGE_LIMITS.max} error={error ?? undefined} rows={4} />
    </ConfirmDialog>
  );
}
