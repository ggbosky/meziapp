import { ArrowLeft, ArrowRight, BadgeCheck, CalendarOff, CircleDashed, UserX } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { ConsultationSteps } from '../../components/booking/ConsultationSteps';
import { LanguageList, SpecializationTags } from '../../components/booking/ProfileTags';
import { SlotPicker } from '../../components/booking/SlotPicker';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../domain/time';

export function PsychologistDetailPage() {
  const { profileId = '' } = useParams();
  const { profiles } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const navigate = useNavigate();
  const profile = profiles.getPublic(profileId);
  const slots = profile ? profiles.listBookableSlots(profile.id) : [];
  const [selected, setSelected] = useState<string | null>(null);
  const selectedSlot = slots.find((s) => s.id === selected) ? selected : null;
  usePageTitle(profile?.professionalName ?? 'Profil není dostupný');

  if (!profile) {
    return (
      <div className="container-page py-14">
        <EmptyState
          icon={<UserX aria-hidden />}
          title="Profil teď není dostupný"
          action={<ButtonLink to="/psychologove">Zpět na seznam psychologů</ButtonLink>}
        >
          Odborník mohl svůj profil pozastavit, nebo odkaz neexistuje.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to="/psychologove" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-800 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Všichni psychologové
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
        <div className="min-w-0 space-y-6">
          <Card className="animate-enter">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar name={profile.professionalName} tone={profile.avatarTone} size="lg" />
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge tone="outline">Fiktivní profil</Badge>
                  {!profile.acceptingBookings && (
                    <Badge tone="amber" icon={<CircleDashed aria-hidden />}>
                      Teď nepřijímá nové rezervace
                    </Badge>
                  )}
                </div>
                <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{profile.professionalName}</h1>
                <p className="mt-1 text-muted">{profile.professionalRole}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-line pt-5">
              <SpecializationTags ids={profile.specializations} />
              <LanguageList ids={profile.languages} />
            </div>
          </Card>

          <Card as="section" aria-labelledby="approach-title">
            <h2 id="approach-title" className="text-lg font-semibold">
              Jak pracuji
            </h2>
            <p className="mt-3 leading-relaxed text-ink/90">{profile.approach || 'Popis přístupu zatím odborník nedoplnil.'}</p>
            {profile.bio && (
              <>
                <h3 className="mt-6 font-semibold">O mně</h3>
                <p className="mt-2 leading-relaxed text-ink/90">{profile.bio}</p>
              </>
            )}
          </Card>

          <Card as="section" aria-labelledby="verification-title">
            <h2 id="verification-title" className="flex items-center gap-2 text-lg font-semibold">
              <BadgeCheck aria-hidden className="size-5 text-brand-700" />
              Kvalifikace a schválení
            </h2>
            <p className="mt-3 leading-relaxed text-ink/90">{profile.qualificationSummary}</p>
            <p className="mt-4 rounded-2xl bg-canvas p-4 text-sm leading-relaxed text-muted">
              Profil schválila administrace {formatDate(profile.approvedAt)}. <strong className="font-medium text-ink">Jde o simulované schválení:</strong>{' '}
              v prototypu se neověřují žádné doklady a všechny údaje jsou smyšlené.
            </p>
          </Card>

          <Card as="section" aria-labelledby="how-title">
            <h2 id="how-title" className="mb-5 text-lg font-semibold">
              Jak probíhá konzultace
            </h2>
            <ConsultationSteps />
          </Card>
        </div>

        <aside aria-labelledby="slots-title" className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <h2 id="slots-title" className="text-lg font-semibold">
              Volné termíny
            </h2>
            <p className="mt-1 text-sm text-muted">Konzultace je zdarma. Časy jsou uvedené v českém čase.</p>
            <div className="mt-5">
              {!profile.acceptingBookings ? (
                <div className="rounded-2xl bg-amber-soft p-4 text-sm text-amber-ink">
                  Odborník teď nepřijímá nové rezervace. Zkus to prosím později nebo si vyber jiného odborníka.
                </div>
              ) : slots.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl bg-canvas px-4 py-6 text-center">
                  <CalendarOff aria-hidden className="size-6 text-muted" />
                  <p className="mt-2 font-medium">Teď nejsou vypsané volné termíny.</p>
                  <p className="mt-1 text-sm text-muted">Nové termíny odborník vypisuje průběžně.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (selectedSlot) navigate(`/rezervace/${profile.id}?termin=${encodeURIComponent(selectedSlot)}`);
                  }}
                >
                  <div className="max-h-[26rem] overflow-y-auto pr-1">
                    <SlotPicker slots={slots} value={selectedSlot} onChange={setSelected} now={now} />
                  </div>
                  <Button type="submit" size="lg" className="mt-5 w-full" disabled={!selectedSlot} icon={<ArrowRight aria-hidden className="size-5" />}>
                    {selectedSlot ? 'Pokračovat k rezervaci' : 'Nejdřív vyber termín'}
                  </Button>
                </form>
              )}
            </div>
          </Card>
          <p className="mt-4 px-1 text-xs leading-relaxed text-muted">
            Rezervace není akutní pomoc. <Link to="/nalehava-pomoc" className="link">Co dělat v naléhavé situaci</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
