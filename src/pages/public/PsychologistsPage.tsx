import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemoSnapshot, useNow, useServices } from '../../app/AppContext';
import { PsychologistCard } from '../../components/booking/PsychologistCard';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/cn';
import { Dialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { RadioCardGroup, SelectField } from '../../components/ui/Field';
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

const SORT_OPTIONS: ReadonlyArray<{ value: CatalogSort; label: string }> = [
  { value: 'soonest', label: 'Nejbližší termín' },
  { value: 'name', label: 'Jméno (A–Z)' },
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

export function PsychologistsPage() {
  usePageTitle('Psychologové');
  const { profiles } = useServices();
  useDemoSnapshot();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filtry žijí v URL, takže přežijí obnovení stránky.
  const rawSpec = params.get('zamereni') ?? '';
  const rawLang = params.get('jazyk') ?? '';
  const rawAvail = params.get('dostupnost') ?? '';
  const specialization = (SPECIALIZATION_IDS as string[]).includes(rawSpec) ? (rawSpec as SpecializationId) : null;
  const language = (LANGUAGE_CODES as string[]).includes(rawLang) ? (rawLang as LanguageCode) : null;
  const availability = ['3', '7', '14'].includes(rawAvail) ? Number(rawAvail) : null;
  const sort: CatalogSort = params.get('razeni') === 'name' ? 'name' : 'soonest';

  const results = profiles.listPublic({ specialization, language, availableWithinDays: availability, sort });
  const activeCount = [specialization, language, availability].filter(Boolean).length;
  const extraCount = [language, availability].filter(Boolean).length;

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
    <div className="container-page py-5 sm:py-8">
      <PageHeader title="Psychologové" description="Vyber si termín bezplatné konzultace. Všichni odborníci v ukázce jsou fiktivní." />

      <section aria-label="Filtry" className="mt-5">
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Zaměření" className="no-scrollbar -ml-4 flex flex-1 gap-2 overflow-x-auto pb-1 pl-4 sm:ml-0 sm:flex-wrap sm:pl-0">
            <Chip active={!specialization} onClick={() => update('zamereni', '')}>
              Vše
            </Chip>
            {SPECIALIZATIONS.map((s) => (
              <Chip key={s.id} active={specialization === s.id} onClick={() => update('zamereni', specialization === s.id ? '' : s.id)}>
                {s.label}
              </Chip>
            ))}
          </div>
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
              {extraCount > 0 && <span className="rounded-full bg-brand-800 px-1.5 text-xs text-white">{extraCount}</span>}
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-4">
        {results.length === 0 ? (
          <EmptyState title="Těmto filtrům teď nikdo neodpovídá" action={<Button onClick={clear}>Vymazat filtry</Button>}>
            Zkus jiné zaměření nebo jazyk, případně rozšiř dostupnost. Kapacita je omezená a nové termíny odborníci vypisují průběžně.
          </EmptyState>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {results.map((summary) => (
              <li key={summary.profile.id}>
                <PsychologistCard summary={summary} now={now} />
              </li>
            ))}
          </ul>
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
          <SelectField
            label="Jazyk konzultace"
            value={language ?? ''}
            onChange={(e) => update('jazyk', e.target.value)}
            options={[{ value: '', label: 'Všechny jazyky' }, ...LANGUAGES.map((l) => ({ value: l.id, label: l.label }))]}
          />
          <SelectField label="Dostupnost" value={availability ? String(availability) : ''} onChange={(e) => update('dostupnost', e.target.value)} options={AVAILABILITY_OPTIONS} />
          <RadioCardGroup legend="Řadit podle" name="sort" options={SORT_OPTIONS} value={sort} onChange={(v) => update('razeni', v === 'name' ? 'name' : '')} />
        </div>
      </Dialog>
    </div>
  );
}
