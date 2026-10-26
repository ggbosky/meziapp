import { useState } from 'react';
import { useAction, useServices } from '../../app/AppContext';
import { Alert } from '../../components/ui/Alert';
import { cn } from '../../components/ui/cn';
import { useToast } from '../../components/ui/Toast';
import type { PsychologistProfile } from '../../domain/types';

/** Přepínač pozastavení příjmu nových rezervací. */
export function AcceptingToggle({ profile }: { profile: PsychologistProfile }) {
  const { profiles } = useServices();
  const toast = useToast();
  const [toggle, pending] = useAction(profiles.setAcceptingBookings);
  const [error, setError] = useState<string | null>(null);
  const on = profile.acceptingBookings;
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p id="accepting-label" className="font-semibold">
            Přijímám nové rezervace
          </p>
          <p id="accepting-desc" className="mt-1 text-sm leading-relaxed text-muted">
            {on
              ? 'Klienti si mohou rezervovat tvé volné termíny.'
              : 'Příjem je pozastavený. Volné termíny se klientům nenabízejí, stávající rezervace zůstávají.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="accepting-label"
          aria-describedby="accepting-desc"
          disabled={pending}
          onClick={async () => {
            const result = await toggle(!on);
            if (!result) return;
            if (result.ok) {
              setError(null);
              toast(result.value.acceptingBookings ? 'Příjem nových rezervací je znovu zapnutý.' : 'Příjem nových rezervací je pozastavený.');
            } else setError(result.error.message);
          }}
          className={cn(
            'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors disabled:opacity-60',
            on ? 'border-brand-800 bg-brand-800' : 'border-line-strong bg-line',
          )}
        >
          <span className={cn('ml-0.5 inline-block size-6 rounded-full bg-white shadow transition-transform', on && 'translate-x-6')} />
          <span className="sr-only">{on ? 'Zapnuto' : 'Vypnuto'}</span>
        </button>
      </div>
      {error && (
        <Alert tone="error" live className="mt-3">
          {error}
        </Alert>
      )}
    </div>
  );
}
