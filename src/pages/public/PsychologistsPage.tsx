import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { PsychologistCard } from '../../components/booking/PsychologistCard';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/cn';
import { EmptyState } from '../../components/ui/EmptyState';
import { SelectField } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { LANGUAGE_CODES, LANGUAGES, SPECIALIZATION_IDS, SPECIALIZATIONS } from '../../domain/catalog';
import { countLabel } from '../../domain/text';
import type { LanguageCode, SpecializationId } from '../../domain/types';
import type { CatalogSort } from '../../services/types';

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Kdykoli' },
  { value: '3', label: 'Volný termín do 3 dnů' },
  { value: '7', label: 'Volný termín do 7 dnů' },
  { value: '14', label: 'Volný termín do 14 dnů' },
];

const SORT_OPTIONS = [
  { value: 'soonest', label: 'Nejbližší volný termín' },
  { value: 'name', label: 'Jméno (A–Z)' },
];

export function PsychologistsPage() {
  usePageTitle('Psychologové');
  const { profiles } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const panelId = useId();

  // Filtry žijí v URL, takže je lze sdílet a přežijí obnovení stránky.
  const rawSpec = params.get('zamereni') ?? '';
  const rawLang = params.get('jazyk') ?? '';
  const rawAvail = params.get('dostupnost') ?? '';
  const specialization = (SPECIALIZATION_IDS as string[]).includes(rawSpec) ? (rawSpec as SpecializationId) : null;
  const language = (LANGUAGE_CODES as string[]).includes(rawLang) ? (rawLang as LanguageCode) : null;
  const availability = ['3', '7', '14'].includes(rawAvail) ? Number(rawAvail) : null;
  const sort: CatalogSort = params.get('razeni') === 'name' ? 'name' : 'soonest';

  const results = profiles.listPublic({ specialization, language, availableWithinDays: availability, sort });
  const activeCount = [specialization, language, availability].filter(Boolean).length;

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const clear = () => {
    const next = new URLSearchParams();
    if (sort === 'name') next.set('razeni', 'name');
    setParams(next, { replace: true });
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeader
        title="Psychologové"
        description="Vyber si termín bezplatné konzultace. Všichni odborníci v ukázce jsou fiktivní."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div>
          <Button
            variant="secondary"
            className="w-full lg:hidden"
            aria-expanded={filtersOpen}
            aria-controls={panelId}
            icon={<SlidersHorizontal aria-hidden className="size-4" />}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen ? 'Skrýt filtry' : 'Zobrazit filtry'}
            {activeCount > 0 && <span className="rounded-full bg-brand-800 px-2 text-xs text-white">{activeCount}</span>}
          </Button>
          <section
            id={panelId}
            aria-label="Filtry"
            className={cn('mt-3 space-y-5 rounded-[var(--radius-card)] border border-line bg-surface p-5 lg:sticky lg:top-24 lg:mt-0 lg:block', !filtersOpen && 'hidden')}
          >
            <SelectField
              label="Zaměření"
              value={specialization ?? ''}
              onChange={(e) => update('zamereni', e.target.value)}
              options={[{ value: '', label: 'Všechna zaměření' }, ...SPECIALIZATIONS.map((s) => ({ value: s.id, label: s.label }))]}
            />
            <SelectField
              label="Jazyk konzultace"
              value={language ?? ''}
              onChange={(e) => update('jazyk', e.target.value)}
              options={[{ value: '', label: 'Všechny jazyky' }, ...LANGUAGES.map((l) => ({ value: l.id, label: l.label }))]}
            />
            <SelectField
              label="Dostupnost"
              value={availability ? String(availability) : ''}
              onChange={(e) => update('dostupnost', e.target.value)}
              options={AVAILABILITY_OPTIONS}
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={activeCount === 0}
              icon={<X aria-hidden className="size-4" />}
              onClick={clear}
            >
              Vymazat filtry
            </Button>
          </section>
        </div>

        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm text-muted" role="status">
              {results.length === 0
                ? 'Žádný odborník neodpovídá filtrům.'
                : `${results.length === 1 ? 'Nalezen' : results.length <= 4 ? 'Nalezeni' : 'Nalezeno'} ${countLabel(results.length, 'odborník', 'odborníci', 'odborníků')}`}
            </p>
            <div className="sm:w-64">
              <SelectField label="Řadit podle" value={sort} onChange={(e) => update('razeni', e.target.value === 'name' ? 'name' : '')} options={SORT_OPTIONS} />
            </div>
          </div>
          {results.length === 0 ? (
            <EmptyState
              icon={<SearchX aria-hidden />}
              title="Těmto filtrům teď nikdo neodpovídá"
              action={<Button onClick={clear}>Vymazat filtry</Button>}
            >
              Zkus vybrat jiné zaměření nebo jazyk, případně rozšířit dostupnost. Kapacita je omezená a nové termíny odborníci vypisují průběžně.
            </EmptyState>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {results.map((summary) => (
                <li key={summary.profile.id}>
                  <PsychologistCard summary={summary} now={now} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
