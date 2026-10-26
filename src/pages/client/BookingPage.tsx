import { ArrowLeft, ArrowRight, CalendarDays, CircleCheck, Clock, FlaskConical, HandHeart, ShieldCheck, UserX, Video } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAction, useCurrentUser, useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { SlotPicker } from '../../components/booking/SlotPicker';
import { RequireRole } from '../../components/layout/RequireRole';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Alert } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Checkbox } from '../../components/ui/Field';
import { Stepper } from '../../components/ui/Stepper';
import { appConfig } from '../../config/app';
import type { DomainError } from '../../domain/result';
import { formatDayLong, formatTimeRange } from '../../domain/time';
import type { AvailabilitySlot } from '../../domain/types';

const STEPS = ['Termín', 'Rekapitulace', 'Potvrzení', 'Hotovo'];

export function BookingPage() {
  return (
    <RequireRole role="client">
      <BookingFlow />
    </RequireRole>
  );
}

function BookingFlow() {
  usePageTitle('Rezervace konzultace');
  const { profileId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { profiles, appointments } = useServices();
  useDemoSnapshot();
  const user = useCurrentUser();
  const now = useNow();
  const navigate = useNavigate();

  const profile = profiles.getPublic(profileId);
  const slots = profile ? profiles.listBookableSlots(profile.id) : [];
  const requested = params.get('termin');
  // Během odesílání držíme vybraný termín, aby po zápisu neblikl stav „termín není k dispozici“.
  const lockedSlot = useRef<AvailabilitySlot | null>(null);
  const slot = lockedSlot.current ?? slots.find((s) => s.id === requested) ?? null;

  const [step, setStep] = useState(slot ? 1 : 0);
  const [adult, setAdult] = useState(false);
  const [understands, setUnderstands] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const [book, booking] = useAction(appointments.book);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  if (!profile) {
    return (
      <div className="container-page py-14">
        <EmptyState icon={<UserX aria-hidden />} title="Tento profil teď není dostupný" action={<ButtonLink to="/psychologove">Vybrat jiného odborníka</ButtonLink>}>
          Odborník mohl profil pozastavit. Vyber si prosím někoho jiného.
        </EmptyState>
      </div>
    );
  }

  const selectSlot = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('termin', id);
    setParams(next, { replace: true });
    setError(null);
  };

  // Termín zmizel z nabídky (např. ho mezitím obsadil někdo v jiné záložce).
  const effectiveStep = step > 0 && !slot ? 0 : step;

  const confirm = async () => {
    if (!slot) return;
    setError(null);
    lockedSlot.current = slot;
    const result = await book(slot.id);
    if (!result) return;
    if (result.ok) {
      navigate(`/klient/rezervace/${result.value.id}/potvrzeno`, { replace: true });
      return;
    }
    lockedSlot.current = null;
    setError(result.error);
  };

  const headings = ['Vyber si termín', 'Zkontroluj rezervaci', 'Potvrď rezervaci'];

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <Link to={`/psychologove/${profile.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-800 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Zpět na profil
      </Link>
      <div className="mt-4">
        <Stepper steps={STEPS} current={effectiveStep} />
      </div>

      <Card className="mt-6 animate-enter" key={effectiveStep}>
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold outline-none sm:text-3xl">
          {headings[effectiveStep]}
        </h1>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-canvas p-3">
          <Avatar name={profile.professionalName} tone={profile.avatarTone} size="sm" />
          <div className="min-w-0">
            <p className="font-medium">{profile.professionalName}</p>
            <p className="text-sm text-muted">{profile.professionalRole}</p>
          </div>
        </div>

        {step > 0 && !slot && (
          <Alert tone="warning" className="mt-4" live>
            Vybraný termín už není k dispozici. Vyber si prosím jiný.
          </Alert>
        )}

        {effectiveStep === 0 && (
          <div className="mt-6">
            {slots.length === 0 ? (
              <EmptyState title="Teď nejsou vypsané volné termíny." action={<ButtonLink to="/psychologove">Prohlédnout další psychology</ButtonLink>}>
                Odborník nové termíny vypisuje průběžně.
              </EmptyState>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (slot) setStep(1);
                }}
              >
                <SlotPicker slots={slots} value={slot?.id ?? null} onChange={selectSlot} now={now} />
                <div className="mt-6 flex justify-end">
                  <Button type="submit" size="lg" disabled={!slot} icon={<ArrowRight aria-hidden className="size-5" />}>
                    Pokračovat
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {effectiveStep >= 1 && slot && (
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { icon: <CalendarDays aria-hidden />, label: 'Datum', value: <span className="first-letter:uppercase">{formatDayLong(slot.startsAt)}</span> },
              { icon: <Clock aria-hidden />, label: 'Čas', value: `${formatTimeRange(slot.startsAt, slot.durationMinutes)} (${slot.durationMinutes} minut)` },
              { icon: <Video aria-hidden />, label: 'Forma', value: 'Online videohovor' },
              { icon: <HandHeart aria-hidden />, label: 'Cena', value: 'Zdarma' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-line p-4">
                <span className="text-brand-700 [&_svg]:size-5">{item.icon}</span>
                <div>
                  <dt className="text-xs text-muted">{item.label}</dt>
                  <dd className="font-medium">{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}

        {effectiveStep === 1 && slot && (
          <>
            <div className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
              <p>
                Rezervace se vytvoří na demo účet <strong className="font-medium text-ink">{user?.displayName}</strong> ({user?.email}).
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-700" />
                Nebudeme po tobě chtít diagnózu, rodné číslo, adresu ani popis toho, co řešíš. O tom můžeš mluvit až na konzultaci.
              </p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="secondary" icon={<ArrowLeft aria-hidden className="size-4" />} onClick={() => setStep(0)}>
                Změnit termín
              </Button>
              <Button size="lg" icon={<ArrowRight aria-hidden className="size-5" />} onClick={() => setStep(2)}>
                Pokračovat k potvrzení
              </Button>
            </div>
          </>
        )}

        {effectiveStep === 2 && slot && (
          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void confirm();
            }}
          >
            <Alert tone="warning" title="Jde o simulaci">
              Potvrzením se rezervace uloží jen do tohoto prohlížeče. Žádný skutečný termín nevznikne, nikomu se nic neodešle a konzultace
              se neuskuteční.
            </Alert>
            <div className="space-y-3 rounded-2xl border border-line p-4">
              <Checkbox checked={adult} onChange={setAdult} label={`Je mi alespoň ${appConfig.minimumAge} let.`} />
              <Checkbox
                checked={understands}
                onChange={setUnderstands}
                label="Beru na vědomí, že rezervace není akutní pomoc."
                description={
                  <>
                    V naléhavé situaci volej {appConfig.urgentHelp.emergencyNumber}. <Link to="/nalehava-pomoc" className="link">Více o naléhavé pomoci</Link>
                  </>
                }
              />
            </div>
            {error && (
              <Alert
                tone="error"
                live
                title="Rezervaci se nepodařilo dokončit"
                action={
                  error.code === 'SLOT_TAKEN' || error.code === 'SLOT_IN_PAST' || error.code === 'SLOT_WITHDRAWN' ? (
                    <Button size="sm" variant="secondary" onClick={() => setStep(0)}>
                      Vybrat jiný termín
                    </Button>
                  ) : error.code === 'BOOKING_LIMIT' ? (
                    <ButtonLink size="sm" variant="secondary" to="/klient">
                      Moje konzultace
                    </ButtonLink>
                  ) : undefined
                }
              >
                {error.message}
              </Alert>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="secondary" icon={<ArrowLeft aria-hidden className="size-4" />} onClick={() => setStep(1)}>
                Zpět
              </Button>
              <Button
                type="submit"
                size="lg"
                loading={booking}
                disabled={!adult || !understands}
                icon={<CircleCheck aria-hidden className="size-5" />}
              >
                Potvrdit rezervaci
              </Button>
            </div>
            {(!adult || !understands) && <p className="text-right text-xs text-muted">Pro potvrzení zaškrtni obě políčka.</p>}
          </form>
        )}
      </Card>
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
        <FlaskConical aria-hidden className="size-3.5" /> Ukázkový režim · Žádná skutečná rezervace nevzniká.
      </p>
    </div>
  );
}
