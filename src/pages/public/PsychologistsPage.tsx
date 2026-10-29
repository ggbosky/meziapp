import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCurrentUser, useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { PsychologistCard } from '../../components/booking/PsychologistCard';
import { LocationBar } from '../../components/location/LocationBar';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/cn';
import { Dialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Checkbox, RadioCardGroup, SelectField } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { appConfig } from '../../config/app';
import { LANGUAGE_CODES, LANGUAGES, SPECIALIZATION_IDS, SPECIALIZATIONS } from '../../domain/catalog';
import { countLabel } from '../../domain/text';
import type { LanguageCode, SpecializationId } from '../../domain/types';
import type { CatalogSort, PublicProfileSummary } from '../../services/types';

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Kdykoli' },
  { value: '3', label: 'Volný termín do 3 dnů' },
  { value: '7', label: 'Volný termín do 7 dnů' },
  { value: '14', label: 'Volný termín do 14 dnů' },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-h-10 shrink-0 whitespace-nowrap rounded-full border-2 px-4 text-sm font-semibold transition-colors',
        active ? 'border-brand-800 bg-brand-800 text-white' : 'border-line bg-surface text-ink hover:border-brand-300',
      )}
    >
      {children}
    </button>
  );
}

function ResultList({ items, now }: { items: PublicProfileSummary[]; now: Date }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((summary) => (
        <li key={summary.profile.id}>
          <PsychologistCard summary={summary} now={now} />
        </li>
      ))}
    </ul>
  );
}

export function PsychologistsPage() {
  usePageTitle('Psychologové');
  const { profiles, session } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const location = session.getLocation();
  const isYouthClient = user?.role === 'client' && user.ageGroup === 'youth';

  // Filtry žijí v URL, takže přežijí obnovení stránky.
  const rawSpec = params.get('zamereni') ?? '';
  const rawLang = params.get('jazyk') ?? '';
  const rawAvail = params.get('dostupnost') ?? '';
  const specialization = (SPECIALIZATION_IDS as string[]).includes(rawSpec) ? (rawSpec as SpecializationId) : null;
  const language = (LANGUAGE_CODES as string[]).includes(rawLang) ? (rawLang as LanguageCode) : null;
  const availability = ['3', '7', '14'].includes(rawAvail) ? Number(rawAvail) : null;
  const inPersonOnly = params.get('osobne') === '1';
  const youthOnly = isYouthClient || params.get('mladi') === '1';
  const rawSort = params.get('razeni');
  const sort: CatalogSort = rawSort === 'name' ? 'name' : rawSort === 'soonest' ? 'soonest' : location ? 'distance' : 'soonest';

  const results = profiles.listPublic({
    specialization,
    language,
    availableWithinDays: availability,
    sort,
    nearCityId: location?.id ?? null,
    inPersonOnly,
    youthOnly,
  });
  const radius = appConfig.location.nearbyRadiusKm;
  const nearby = location ? results.filter((r) => r.distanceKm !== null && r.distanceKm <= radius) : [];
  const others = location ? results.filter((r) => !nearby.includes(r)) : results;
  const sheetCount = [language, availability, inPersonOnly || null, (!isYouthClient && youthOnly) || null].filter(Boolean).length;
  const activeCount = sheetCount + (specialization ? 1 : 0);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const clear = () => {
    const next = new URLSearchParams();
    if (rawSort) next.set('razeni', rawSort);
    setParams(next, { replace: true });
  };

  const sortOptions: Array<{ value: CatalogSort; label: string }> = [
    ...(location ? [{ value: 'distance' as const, label: 'Nejblíž mně' }] : []),
    { value: 'soonest', label: 'Nejbližší termín' },
    { value: 'name', label: 'Jméno (A–Z)' },
  ];

  return (
    <div className="container-page py-5 sm:py-8">
      <PageHeader title="Psychologové" description="Vyber si termín bezplatné konzultace. Všichni odborníci v ukázce jsou fiktivní." />

      <LocationBar className="mt-5" />

      {isYouthClient && (
        <Alert tone="info" className="mt-3">
          Je ti {appConfig.minimumAge}–{appConfig.adultAge - 1}, proto ti ukazujeme odborníky, kteří pracují s dospívajícími.
        </Alert>
      )}

      <section aria-label="Filtry" className="mt-4">
        <div role="group" aria-label="Zaměření" className="no-scrollbar -ml-4 flex gap-2 overflow-x-auto pb-1 pl-4 sm:ml-0 sm:flex-wrap sm:pl-0">
          <Chip active={!specialization} onClick={() => update('zamereni', '')}>
            Vše
          </Chip>
          {SPECIALIZATIONS.map((s) => (
            <Chip key={s.id} active={specialization === s.id} onClick={() => update('zamereni', specialization === s.id ? '' : s.id)}>
              {s.label}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-muted" role="status">
            {results.length === 0
              ? 'Žádný odborník neodpovídá filtrům'
              : `${results.length === 1 ? 'Nalezen' : results.length <= 4 ? 'Nalezeni' : 'Nalezeno'} ${countLabel(results.length, 'odborník', 'odborníci', 'odborníků')}`}
          </p>
          <div className="flex gap-2">
            {activeCount > 0 && (
              <Button size="sm" variant="ghost" icon={<X aria-hidden className="size-4" />} onClick={clear}>
                Vymazat filtry
              </Button>
            )}
            <Button size="sm" variant="secondary" icon={<SlidersHorizontal aria-hidden className="size-4" />} onClick={() => setSheetOpen(true)}>
              Další filtry
              {sheetCount > 0 && <span className="rounded-full bg-brand-800 px-1.5 text-xs text-white">{sheetCount}</span>}
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-4 space-y-8">
        {results.length === 0 ? (
          <EmptyState title="Těmto filtrům teď nikdo neodpovídá" action={<Button onClick={clear}>Vymazat filtry</Button>}>
            Zkus jiné zaměření nebo jazyk, případně rozšiř dostupnost. Kapacita je omezená a nové termíny odborníci vypisují průběžně.
          </EmptyState>
        ) : location ? (
          <>
            <section aria-labelledby="nearby-title">
              <h2 id="nearby-title" className="mb-3 text-xl font-extrabold">
                Ve tvém okolí <span className="text-base font-semibold text-muted">· do {radius} km od města {location.name}</span>
              </h2>
              {nearby.length > 0 ? (
                <ResultList items={nearby} now={now} />
              ) : (
                <p className="rounded-[var(--radius-card)] bg-surface p-5 text-muted shadow-soft">
                  V okolí teď nikdo neodpovídá filtrům. Konzultace online ale můžeš mít s kýmkoli níže.
                </p>
              )}
            </section>
            {others.length > 0 && (
              <section aria-labelledby="others-title">
                <h2 id="others-title" className="mb-3 text-xl font-extrabold">
                  Další psychologové <span className="text-base font-semibold text-muted">· konzultace online</span>
                </h2>
                <ResultList items={others} now={now} />
              </section>
            )}
          </>
        ) : (
          <ResultList items={results} now={now} />
        )}
      </div>

      <Dialog
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Další filtry"
        footer={
          <>
            <Button variant="secondary" onClick={clear} disabled={activeCount === 0}>
              Vymazat filtry
            </Button>
            <Button onClick={() => setSheetOpen(false)}>Zobrazit {countLabel(results.length, 'odborníka', 'odborníky', 'odborníků')}</Button>
          </>
        }
      >
        <div className="space-y-5 pb-2">
          <RadioCardGroup
            legend="Forma konzultace"
            name="format"
            options={[
              { value: 'all', label: 'Online i osobně' },
              { value: 'in_person', label: 'Chci se potkat osobně' },
            ]}
            value={inPersonOnly ? 'in_person' : 'all'}
            onChange={(v) => update('osobne', v === 'in_person' ? '1' : '')}
          />
          <Checkbox
            checked={youthOnly}
            onChange={(v) => update('mladi', v ? '1' : '')}
            label={`Jen odborníci, kteří pracují s dospívajícími (${appConfig.minimumAge}–${appConfig.adultAge - 1} let)`}
            description={isYouthClient ? 'U tvého účtu je tento filtr zapnutý vždy.' : undefined}
          />
          <SelectField
            label="Jazyk konzultace"
            value={language ?? ''}
            onChange={(e) => update('jazyk', e.target.value)}
            options={[{ value: '', label: 'Všechny jazyky' }, ...LANGUAGES.map((l) => ({ value: l.id, label: l.label }))]}
          />
          <SelectField label="Dostupnost" value={availability ? String(availability) : ''} onChange={(e) => update('dostupnost', e.target.value)} options={AVAILABILITY_OPTIONS} />
          <RadioCardGroup legend="Řadit podle" name="sort" options={sortOptions} value={sort} onChange={(v) => update('razeni', v)} columns={location ? 3 : 2} />
        </div>
      </Dialog>
    </div>
  );
}
