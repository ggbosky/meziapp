import { ArrowLeft, ArrowRight, BadgeCheck, CalendarOff, CircleDashed, Languages, MapPin, UserX } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { ConsultationSteps } from '../../components/booking/ConsultationSteps';
import { SlotPicker } from '../../components/booking/SlotPicker';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Avatar } from '../../components/ui/Avatar';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { languageLabel, specializationLabel } from '../../domain/catalog';
import { cityById, distanceKm, formatDistance } from '../../domain/places';
import { atTime, formatDate, formatRelativeDay } from '../../domain/time';

const PANEL_TONES = ['bg-sage-100', 'bg-sun-soft', 'bg-peach-soft', 'bg-sky-soft', 'bg-sage-100', 'bg-peach-soft'];

export function PsychologistDetailPage() {
  const { profileId = '' } = useParams();
  const { profiles, session } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const navigate = useNavigate();
  const profile = profiles.getPublic(profileId);
  const slots = profile ? profiles.listBookableSlots(profile.id) : [];
  const [selected, setSelected] = useState<string | null>(null);
  const selectedSlot = slots.find((s) => s.id === selected) ?? null;
  const city = cityById(profile?.cityId);
  const myCity = session.getLocation();
  const distance = city && myCity ? distanceKm(myCity, city) : null;
  usePageTitle(profile?.professionalName ?? 'Profil není dostupný');

  if (!profile) {
    return (
      <div className="container-page py-10">
        <EmptyState icon={<UserX aria-hidden />} title="Profil teď není dostupný" action={<ButtonLink to="/psychologove">Zpět na seznam psychologů</ButtonLink>}>
          Odborník mohl svůj profil pozastavit, nebo odkaz neexistuje.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container-page py-4 sm:py-8">
      <Link to="/psychologove" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Všichni psychologové
      </Link>

      <div className="mt-2 grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-8">
        <section className={`animate-enter rounded-[28px] p-6 text-center sm:p-8 sm:text-left ${PANEL_TONES[profile.avatarTone % PANEL_TONES.length]}`}>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar name={profile.professionalName} tone={profile.avatarTone} size="lg" className="ring-4 ring-white" />
            <div className="min-w-0">
              <h1 className="font-display text-[2rem] font-extrabold leading-tight sm:text-4xl">{profile.professionalName}</h1>
              <p className="mt-0.5 font-semibold text-ink/70">{profile.professionalRole}</p>
              <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-ink/70 sm:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <Languages aria-hidden className="size-4" />
                  <span className="sr-only">Jazyky: </span>
                  {profile.languages.map(languageLabel).join(', ')}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-ink/80">
                  <MapPin aria-hidden className="size-4" />
                  {city ? (profile.offersInPerson ? `${city.name} · online i osobně` : `${city.name} · jen online`) : 'Jen online'}
                  {distance !== null && <span className="font-medium text-ink/60">({formatDistance(distance)} od tebe)</span>}
                </span>
              </p>
            </div>
          </div>
          <ul className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start" aria-label="Zaměření">
            {profile.worksWithYouth && <li className="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">Pracuje s dospívajícími</li>}
            {profile.specializations.map((id) => (
              <li key={id} className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-ink">
                {specializationLabel(id)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-semibold text-ink/60">Fiktivní profil pro ukázku aplikace</p>
        </section>

        <aside aria-labelledby="slots-title" className="lg:row-span-2 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <h2 id="slots-title" className="text-xl font-extrabold">
              Vyber si termín
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Zdarma · český čas{profile.offersInPerson && city ? ` · termíny označené „osobně“ jsou v místě ${city.name}` : ' · online'}
            </p>
            <div className="mt-4">
              {!profile.acceptingBookings ? (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-soft p-4 text-sm text-amber-ink">
                  <CircleDashed aria-hidden className="mt-0.5 size-4 shrink-0" />
                  Odborník teď nepřijímá nové rezervace. Zkus to prosím později nebo si vyber jiného odborníka.
                </div>
              ) : slots.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl bg-canvas px-4 py-6 text-center">
                  <CalendarOff aria-hidden className="size-6 text-muted" />
                  <p className="mt-2 font-bold">Teď nejsou vypsané volné termíny.</p>
                  <p className="mt-1 text-sm text-muted">Nové termíny odborník vypisuje průběžně.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (selectedSlot) navigate(`/rezervace/${profile.id}?termin=${encodeURIComponent(selectedSlot.id)}`);
                  }}
                >
                  <SlotPicker slots={slots} value={selectedSlot?.id ?? null} onChange={setSelected} now={now} />
                  <Button type="submit" size="lg" className="mt-5 w-full" disabled={!selectedSlot} icon={<ArrowRight aria-hidden className="size-5" />}>
                    {selectedSlot ? (
                      <span className="first-letter:uppercase">
                        Pokračovat · {formatRelativeDay(selectedSlot.startsAt, now)} {atTime(selectedSlot.startsAt)}
                      </span>
                    ) : (
                      'Nejdřív vyber čas'
                    )}
                  </Button>
                </form>
              )}
            </div>
          </Card>
          <p className="mt-3 px-1 text-xs leading-relaxed text-muted">
            Rezervace není akutní pomoc. <Link to="/nalehava-pomoc" className="link">Co dělat v naléhavé situaci</Link>
          </p>
        </aside>

        <div className="min-w-0 space-y-4">
          <Card as="section" aria-labelledby="approach-title">
            <h2 id="approach-title" className="text-xl font-extrabold">
              Jak pracuji
            </h2>
            <p className="mt-2.5 leading-relaxed text-ink/90">{profile.approach || 'Popis přístupu zatím odborník nedoplnil.'}</p>
            {profile.bio && <p className="mt-3 leading-relaxed text-muted">{profile.bio}</p>}
          </Card>

          <Card as="section" aria-labelledby="how-title">
            <h2 id="how-title" className="mb-4 text-xl font-extrabold">
              Jak probíhá konzultace
            </h2>
            <ConsultationSteps />
          </Card>

          <Card as="section" aria-labelledby="verification-title">
            <h2 id="verification-title" className="flex items-center gap-2 text-xl font-extrabold">
              <BadgeCheck aria-hidden className="size-5 text-brand-700" />
              Kvalifikace a schválení
            </h2>
            <p className="mt-2.5 leading-relaxed text-ink/90">{profile.qualificationSummary}</p>
            <p className="mt-3 rounded-2xl bg-canvas p-4 text-sm leading-relaxed text-muted">
              Profil schválila administrace {formatDate(profile.approvedAt)}. <strong className="font-semibold text-ink">Jde o simulované schválení:</strong>{' '}
              v prototypu se neověřují žádné doklady a všechny údaje jsou smyšlené.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
