import { ArrowLeft, CalendarDays, CalendarX2, CircleCheck, Clock, HandHeart, MessageSquareText, Video } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAction, useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { JoinCallButton } from '../../components/booking/JoinCallDialog';
import { RequireRole } from '../../components/layout/RequireRole';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Alert } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { RadioCardGroup, TextArea } from '../../components/ui/Field';
import { AppointmentStatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { formatDateTime, formatDayLong, formatTimestamp, formatTimeRange } from '../../domain/time';
import type { ProcessClarity } from '../../domain/types';
import { FEEDBACK_NOTE_MAX } from '../../domain/validation';
import type { ClientAppointmentView } from '../../services/types';

export function AppointmentDetailPage() {
  return (
    <RequireRole role="client">
      <AppointmentDetail />
    </RequireRole>
  );
}

function AppointmentDetail() {
  const { appointmentId = '' } = useParams();
  const { appointments } = useServices();
  useDemoSnapshot();
  useNow();
  const view = appointments.getMine(appointmentId);
  usePageTitle('Detail rezervace');

  if (!view) {
    return (
      <div className="container-page py-14">
        <EmptyState icon={<CalendarX2 aria-hidden />} title="Rezervaci jsme nenašli" action={<ButtonLink to="/klient">Zpět na moje konzultace</ButtonLink>}>
          Možná patří jinému demo účtu, nebo byla demo data obnovena.
        </EmptyState>
      </div>
    );
  }
  return <AppointmentDetailContent view={view} />;
}

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-brand-700 [&_svg]:size-5">{icon}</span>
      <div>
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}

function AppointmentDetailContent({ view }: { view: ClientAppointmentView }) {
  const { appointments } = useServices();
  const toast = useToast();
  const now = useNow();
  const { appointment, profile, status } = view;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancel, cancelling] = useAction(appointments.cancelAsClient);

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <Link to="/klient" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-800 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Moje konzultace
      </Link>

      <Card className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <AppointmentStatusBadge status={status} />
            <h1 className="mt-3 font-display text-2xl font-extrabold first-letter:uppercase sm:text-3xl">{formatDateTime(appointment.startsAt, now)}</h1>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-canvas p-3">
          <Avatar name={profile.professionalName} tone={profile.avatarTone} size="sm" />
          <div className="min-w-0">
            <p className="font-medium">{profile.professionalName}</p>
            <p className="text-sm text-muted">{profile.professionalRole}</p>
          </div>
          {profile.status === 'active' && (
            <Link to={`/psychologove/${profile.id}`} className="link ml-auto text-sm">
              Profil
            </Link>
          )}
        </div>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <Detail icon={<CalendarDays aria-hidden />} label="Datum">
            <span className="first-letter:uppercase">{formatDayLong(appointment.startsAt)}</span>
          </Detail>
          <Detail icon={<Clock aria-hidden />} label="Čas">
            {formatTimeRange(appointment.startsAt, appointment.durationMinutes)} ({appointment.durationMinutes} minut)
          </Detail>
          <Detail icon={<Video aria-hidden />} label="Forma">
            Online videohovor (v prototypu simulovaný)
          </Detail>
          <Detail icon={<HandHeart aria-hidden />} label="Cena">
            Zdarma
          </Detail>
        </dl>
        <p className="mt-6 text-xs text-muted">
          Rezervace vytvořena {formatTimestamp(appointment.createdAt)}
          {appointment.cancelledAt ? ` · zrušena ${formatTimestamp(appointment.cancelledAt)}` : ''}
        </p>

        {status === 'booked' && (
          <div className="mt-6 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:justify-between">
            {view.canCancel ? (
              <Button variant="secondary" icon={<CalendarX2 aria-hidden className="size-4" />} onClick={() => setConfirmOpen(true)}>
                Zrušit rezervaci
              </Button>
            ) : (
              <span />
            )}
            <JoinCallButton />
          </div>
        )}
        {error && (
          <Alert tone="error" live className="mt-4">
            {error}
          </Alert>
        )}
        {status === 'cancelled_by_psychologist' && (
          <Alert tone="warning" className="mt-6" title="Odborník tuto konzultaci zrušil">
            Omlouváme se. Termín se už nenabízí. Můžeš si vybrat jiný termín u stejného nebo jiného odborníka.
          </Alert>
        )}
        {status === 'cancelled_by_client' && (
          <Alert tone="info" className="mt-6">
            Tuto rezervaci jsi zrušil(a). Pokud byl termín v budoucnu, znovu se nabídl ostatním.
          </Alert>
        )}
      </Card>

      {status === 'completed' && <FeedbackSection view={view} />}

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        icon={<CalendarX2 aria-hidden />}
        title="Zrušit rezervaci?"
        description={`${formatDateTime(appointment.startsAt, now)} u odborníka ${profile.professionalName}.`}
        confirmLabel="Ano, zrušit rezervaci"
        cancelLabel="Ponechat rezervaci"
        variant="danger"
        loading={cancelling}
        onConfirm={async () => {
          const result = await cancel(appointment.id);
          if (!result) return;
          setConfirmOpen(false);
          if (result.ok) {
            setError(null);
            toast('Rezervace je zrušená. Termín se uvolnil pro ostatní.');
          } else setError(result.error.message);
        }}
      >
        Termín se uvolní pro někoho dalšího. Důvod zrušení nemusíš uvádět. V ukázce se nikomu nic neodesílá.
      </ConfirmDialog>
    </div>
  );
}

const CLARITY_OPTIONS: ReadonlyArray<{ value: ProcessClarity; label: string }> = [
  { value: 'clear', label: 'Srozumitelný' },
  { value: 'partly', label: 'Částečně' },
  { value: 'unclear', label: 'Nesrozumitelný' },
];

function FeedbackSection({ view }: { view: ClientAppointmentView }) {
  const { appointments } = useServices();
  const toast = useToast();
  const [clarity, setClarity] = useState<ProcessClarity | null>(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submit, submitting] = useAction(appointments.submitFeedback);

  if (view.feedback) {
    return (
      <Card as="section" className="mt-6" aria-labelledby="fb-title">
        <h2 id="fb-title" className="flex items-center gap-2 text-lg font-semibold">
          <CircleCheck aria-hidden className="size-5 text-brand-700" /> Děkujeme za zpětnou vazbu
        </h2>
        <p className="mt-2 text-sm text-muted">
          Průběh rezervace: <strong className="font-medium text-ink">{CLARITY_OPTIONS.find((o) => o.value === view.feedback?.processClarity)?.label}</strong>
        </p>
        {view.feedback.note && <p className="mt-2 rounded-2xl bg-canvas p-4 text-sm">„{view.feedback.note}“</p>}
        <p className="mt-3 text-xs text-muted">Zpětná vazba je soukromá a slouží jen ke zlepšení služby. Odborník ji v ukázce nevidí.</p>
      </Card>
    );
  }

  return (
    <Card as="section" className="mt-6" aria-labelledby="fb-title">
      <h2 id="fb-title" className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquareText aria-hidden className="size-5 text-brand-700" /> Krátká zpětná vazba
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Nepovinné a soukromé. Ptáme se jen na průběh služby, ne na tvé zdraví ani na výsledek konzultace. Odpovědi nejsou měřítkem
        účinnosti.
      </p>
      <form
        className="mt-5 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!clarity) {
            setErrors({ processClarity: 'Vyber prosím jednu z možností.' });
            return;
          }
          const result = await submit(view.appointment.id, { processClarity: clarity, note });
          if (!result) return;
          if (result.ok) toast('Děkujeme, zpětná vazba je uložená.');
          else setErrors(result.error.fieldErrors ?? { form: result.error.message });
        }}
      >
        <RadioCardGroup
          legend="Jak srozumitelný pro tebe byl průběh rezervace a připojení?"
          name="clarity"
          options={CLARITY_OPTIONS}
          value={clarity}
          onChange={(v) => {
            setClarity(v);
            setErrors({});
          }}
          error={errors.processClarity}
          columns={3}
        />
        <TextArea
          label="Co bychom mohli zlepšit? (nepovinné)"
          hint="Nepiš sem prosím nic o svém zdravotním stavu ani jiné osobní údaje."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxChars={FEEDBACK_NOTE_MAX}
          error={errors.note}
          rows={3}
        />
        {errors.form && (
          <Alert tone="error" live>
            {errors.form}
          </Alert>
        )}
        <Button type="submit" loading={submitting}>
          Odeslat zpětnou vazbu
        </Button>
      </form>
    </Card>
  );
}
