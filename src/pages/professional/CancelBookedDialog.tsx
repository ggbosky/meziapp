import { CalendarX2 } from 'lucide-react';
import { useState } from 'react';
import { useAction, useServices } from '../../app/AppContext';
import { Alert } from '../../components/ui/Alert';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { Checkbox } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { formatDateTime } from '../../domain/time';

/** Zrušení rezervovaného termínu odborníkem — s jasným potvrzením. */
export function CancelBookedDialog({
  target,
  onClose,
  now,
}: {
  target: { appointmentId: string; startsAt: string; clientLabel: string } | null;
  onClose: () => void;
  now: Date;
}) {
  const { appointments } = useServices();
  const toast = useToast();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancel, pending] = useAction(appointments.cancelAsPsychologist);
  const close = () => {
    setConfirmed(false);
    setError(null);
    onClose();
  };
  return (
    <ConfirmDialog
      open={target !== null}
      onCancel={close}
      variant="danger"
      icon={<CalendarX2 aria-hidden />}
      title="Zrušit rezervovaný termín?"
      description={target ? `${formatDateTime(target.startsAt, now)} · klient ${target.clientLabel}` : undefined}
      confirmLabel="Zrušit termín i rezervaci"
      cancelLabel="Ponechat"
      loading={pending}
      confirmDisabled={!confirmed}
      onConfirm={async () => {
        if (!target) return;
        const result = await cancel(target.appointmentId);
        if (!result) return;
        if (result.ok) {
          toast('Rezervovaný termín je zrušený a už se nenabízí.');
          close();
        } else setError(result.error.message);
      }}
    >
      <div className="space-y-3">
        <p>
          Klient přijde o domluvenou konzultaci. Ve skutečné službě by dostal oznámení s omluvou a odkazem na jiné termíny. V ukázce se nic
          neodesílá.
        </p>
        <p>Termín se zruší a klientům se znovu nenabídne. Tuto akci nelze vrátit.</p>
        <Checkbox checked={confirmed} onChange={setConfirmed} label="Rozumím, že klient přijde o rezervaci." />
        {error && (
          <Alert tone="error" live>
            {error}
          </Alert>
        )}
      </div>
    </ConfirmDialog>
  );
}
