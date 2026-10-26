import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useServices } from '../../app/AppContext';
import { Button, type ButtonSize, type ButtonVariant } from '../ui/Button';
import { ConfirmDialog } from '../ui/Dialog';
import { useToast } from '../ui/Toast';

export function ResetDemoButton({ variant = 'secondary', size = 'md', className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string }) {
  const { demo } = useServices();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} className={className} icon={<RotateCcw aria-hidden className="size-4" />} onClick={() => setOpen(true)}>
        Obnovit demo
      </Button>
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          demo.reset();
          setOpen(false);
          toast('Demo data jsou obnovená do výchozího stavu.');
        }}
        icon={<RotateCcw aria-hidden />}
        title="Obnovit výchozí demo data?"
        description="Smažou se všechny změny, které jsi v tomto prohlížeči v ukázce udělal(a): rezervace, termíny, přihlášky i rozhodnutí administrace. Termíny se znovu vygenerují od dnešního dne."
        confirmLabel="Obnovit demo data"
        cancelLabel="Ponechat změny"
      />
    </>
  );
}
