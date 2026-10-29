import { ArrowRight, CircleCheck, FileText, Repeat, Save, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useDemoSnapshot, useServices } from '../../app/AppContext';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Alert } from '../../components/ui/Alert';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox, ChipCheckboxGroup, TextArea, TextField } from '../../components/ui/Field';
import { CitySelect } from '../../components/location/CitySelect';
import { appConfig } from '../../config/app';
import { cityById } from '../../domain/places';
import { PageHeader, SectionTitle } from '../../components/ui/PageHeader';
import { ApplicationStatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { DEMO_USER_IDS } from '../../data/seed';
import { languageLabel, LANGUAGES, specializationLabel, SPECIALIZATIONS } from '../../domain/catalog';
import { countLabel } from '../../domain/text';
import { formatTimestamp } from '../../domain/time';
import type { ApplicationFields, PsychologistApplication } from '../../domain/types';
import { APPLICATION_LIMITS, emptyApplicationFields } from '../../domain/validation';

const FIELD_LABELS: Record<string, string> = {
  professionalName: 'Profesní jméno',
  professionalRole: 'Profesní role',
  qualificationSummary: 'Shrnutí kvalifikace',
  specializations: 'Zaměření',
  languages: 'Jazyky',
  capacityPerMonth: 'Nabízená kapacita',
  bio: 'Profesní popis',
  cityId: 'Město praxe',
};

export function ApplicationPage() {
  usePageTitle('Přihláška odborníka');
  const { applications } = useServices();
  useDemoSnapshot();
  const application = applications.getOwn();
  const editable = !application || application.status === 'draft' || application.status === 'needs_changes';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Přihláška odborníka"
        description="Každou přihlášku ručně posoudí provozní tým. V prototypu je posouzení simulované a nenahrávají se žádné doklady."
        actions={application ? <ApplicationStatusBadge status={application.status} /> : undefined}
      />
      <StatusTimeline application={application} />
      {application?.status === 'needs_changes' && application.reviewerMessage && (
        <Alert tone="warning" title="Administrace žádá o doplnění">
          {application.reviewerMessage}
        </Alert>
      )}
      {editable ? <ApplicationForm application={application} key={application?.id ?? 'new'} /> : <ApplicationSummary application={application!} />}
    </div>
  );
}

function StatusTimeline({ application }: { application: PsychologistApplication | null }) {
  const status = application?.status ?? null;
  const steps = [
    { label: 'Vyplnění přihlášky', done: status !== null && status !== 'draft' && status !== 'needs_changes', current: status === null || status === 'draft' || status === 'needs_changes' },
    { label: 'Posouzení administrací', done: status === 'approved' || status === 'rejected', current: status === 'submitted' },
    { label: 'Vypisování termínů', done: false, current: status === 'approved' },
  ];
  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {steps.map((s, i) => (
        <li
          key={s.label}
          aria-current={s.current ? 'step' : undefined}
          className={
            s.current
              ? 'flex items-center gap-3 rounded-2xl border border-brand-700 bg-sage-50 p-3.5'
              : 'flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5'
          }
        >
          <span
            className={
              s.done
                ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white'
                : s.current
                  ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-800 text-sm font-semibold text-white'
                  : 'flex size-8 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-semibold text-muted'
            }
          >
            {s.done ? <CircleCheck aria-hidden className="size-4" /> : i + 1}
          </span>
          <span className="text-sm">
            <span className={s.current ? 'font-semibold text-ink' : 'text-muted'}>{s.label}</span>
            <span className="sr-only">{s.done ? ' (hotovo)' : s.current ? ' (aktuální krok)' : ''}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function ApplicationForm({ application }: { application: PsychologistApplication | null }) {
  const { applications } = useServices();
  const toast = useToast();
  const [fields, setFields] = useState<ApplicationFields>(() =>
    application
      ? {
          professionalName: application.professionalName,
          professionalRole: application.professionalRole,
          qualificationSummary: application.qualificationSummary,
          specializations: application.specializations,
          languages: application.languages,
          capacityPerMonth: application.capacityPerMonth,
          bio: application.bio,
          cityId: application.cityId,
          offersInPerson: application.offersInPerson,
          worksWithYouth: application.worksWithYouth,
        }
      : emptyApplicationFields(),
  );
  const [capacityText, setCapacityText] = useState(String(fields.capacityPerMonth || ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveDraft, savingDraft] = useAction(applications.saveDraft);
  const [submit, submitting] = useAction(applications.submit);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [focusSummary, setFocusSummary] = useState(0);

  useEffect(() => {
    if (focusSummary) summaryRef.current?.focus();
  }, [focusSummary]);

  const set = <K extends keyof ApplicationFields>(key: K, value: ApplicationFields[K]) => setFields((f) => ({ ...f, [key]: value }));
  const payload = (): ApplicationFields => ({ ...fields, capacityPerMonth: capacityText.trim() === '' ? 0 : Number(capacityText) });

  const handle = async (mode: 'draft' | 'submit') => {
    const result = await (mode === 'draft' ? saveDraft(payload()) : submit(payload()));
    if (!result) return;
    if (result.ok) {
      setErrors({});
      toast(mode === 'draft' ? 'Rozpracovaná přihláška je uložená.' : 'Přihláška je odeslaná k posouzení.');
    } else {
      setErrors(result.error.fieldErrors ?? { form: result.error.message });
      setFocusSummary((n) => n + 1);
    }
  };

  const errorEntries = Object.entries(errors).filter(([k]) => k !== 'form');
  const L = APPLICATION_LIMITS;

  return (
    <Card as="section" aria-labelledby="form-title">
      <SectionTitle id="form-title" description="Vyplň prosím fiktivní údaje. Nevkládej skutečné osobní ani zdravotní informace.">
        {application?.status === 'needs_changes' ? 'Doplnění přihlášky' : 'Údaje o tobě'}
      </SectionTitle>
      <form
        noValidate
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void handle('submit');
        }}
      >
        {(errorEntries.length > 0 || errors.form) && (
          <div ref={summaryRef} tabIndex={-1} className="outline-none">
            <Alert tone="error" title="Přihlášku zatím nejde uložit" live>
              {errors.form ?? (
                <ul className="list-disc space-y-0.5 pl-4">
                  {errorEntries.map(([key, message]) => (
                    <li key={key}>
                      <a href={`#app-${key}`} onClick={(e) => { e.preventDefault(); document.getElementById(`app-${key}`)?.focus(); }}>
                        {FIELD_LABELS[key] ?? key}
                      </a>
                      : {message}
                    </li>
                  ))}
                </ul>
              )}
            </Alert>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="app-professionalName"
            label="Profesní jméno (fiktivní)"
            value={fields.professionalName}
            onChange={(e) => set('professionalName', e.target.value)}
            error={errors.professionalName}
            hint="Jak tě uvidí klienti, např. Jana Nováková."
            maxLength={L.professionalName.max}
            autoComplete="off"
            required
          />
          <TextField
            id="app-professionalRole"
            label="Profesní role"
            value={fields.professionalRole}
            onChange={(e) => set('professionalRole', e.target.value)}
            error={errors.professionalRole}
            hint="Např. Psycholožka, Poradenský psycholog."
            maxLength={L.professionalRole.max}
            autoComplete="off"
            required
          />
        </div>
        <TextArea
          id="app-qualificationSummary"
          label="Shrnutí kvalifikace"
          hint="Vzdělání, výcviky a praxe v několika větách. Doklady se v prototypu nenahrávají."
          value={fields.qualificationSummary}
          onChange={(e) => set('qualificationSummary', e.target.value)}
          error={errors.qualificationSummary}
          maxChars={L.qualificationSummary.max}
          required
        />
        <div id="app-specializations" tabIndex={-1} className="outline-none">
          <ChipCheckboxGroup
            legend="Zaměření"
            hint={`Vyber 1 až ${L.specializationsMax}.`}
            name="specializations"
            options={SPECIALIZATIONS.map((s) => ({ value: s.id, label: s.label }))}
            value={fields.specializations}
            onChange={(v) => set('specializations', v)}
            error={errors.specializations}
            required
          />
        </div>
        <div id="app-languages" tabIndex={-1} className="outline-none">
          <ChipCheckboxGroup
            legend="Jazyky konzultací"
            name="languages"
            options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
            value={fields.languages}
            onChange={(v) => set('languages', v)}
            error={errors.languages}
            required
          />
        </div>
        <div className="sm:w-72">
          <TextField
            id="app-capacityPerMonth"
            label="Nabízená kapacita"
            type="number"
            inputMode="numeric"
            min={L.capacity.min}
            max={L.capacity.max}
            value={capacityText}
            onChange={(e) => setCapacityText(e.target.value)}
            error={errors.capacityPerMonth}
            hint={`Počet bezplatných konzultací měsíčně (${L.capacity.min}–${L.capacity.max}).`}
            required
          />
        </div>
        <div className="space-y-3 rounded-2xl bg-canvas p-4">
          <CitySelect
            id="app-cityId"
            label="Město praxe"
            value={fields.cityId}
            onChange={(v) => set('cityId', v)}
            emptyLabel="Neuvádět (jen online)"
            hint="Klientům ukážeme jen město a přibližnou vzdálenost, ne adresu."
            error={errors.cityId}
          />
          <Checkbox checked={fields.offersInPerson} onChange={(v) => set('offersInPerson', v)} label="Můžu nabídnout i osobní setkání" />
          <Checkbox
            checked={fields.worksWithYouth}
            onChange={(v) => set('worksWithYouth', v)}
            label={`Pracuji i s dospívajícími (${appConfig.minimumAge}–${appConfig.adultAge - 1} let)`}
          />
        </div>
        <TextArea
          id="app-bio"
          label="Stručný profesní popis"
          hint="Pár vět o tom, s čím lidem pomáháš. Bez příslibů výsledků."
          value={fields.bio}
          onChange={(e) => set('bio', e.target.value)}
          error={errors.bio}
          maxChars={L.bio.max}
          required
        />
        <div className="flex flex-col-reverse gap-2 border-t border-line pt-6 sm:flex-row sm:justify-end">
          <Button variant="secondary" loading={savingDraft} disabled={submitting} icon={<Save aria-hidden className="size-4" />} onClick={() => void handle('draft')}>
            Uložit rozpracovanou
          </Button>
          <Button type="submit" loading={submitting} disabled={savingDraft} icon={<Send aria-hidden className="size-4" />}>
            Odeslat k posouzení
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ApplicationSummary({ application }: { application: PsychologistApplication }) {
  const { session } = useServices();
  const navigate = useNavigate();
  const rows: Array<[string, string]> = [
    ['Profesní jméno', application.professionalName],
    ['Profesní role', application.professionalRole],
    ['Shrnutí kvalifikace', application.qualificationSummary],
    ['Zaměření', application.specializations.map(specializationLabel).join(', ')],
    ['Jazyky', application.languages.map(languageLabel).join(', ')],
    ['Nabízená kapacita', `${countLabel(application.capacityPerMonth, 'konzultace', 'konzultace', 'konzultací')} měsíčně`],
    ['Profesní popis', application.bio],
    ['Město a forma', `${cityById(application.cityId)?.name ?? 'Neuvedeno'} · ${application.offersInPerson ? 'online i osobně' : 'jen online'}`],
    ['Dospívající klienti', application.worksWithYouth ? 'Ano' : 'Ne'],
  ];
  return (
    <div className="space-y-6">
      {application.status === 'submitted' && (
        <Alert
          tone="info"
          title="Přihláška čeká na posouzení"
          action={
            <Button
              size="sm"
              variant="secondary"
              icon={<Repeat aria-hidden className="size-4" />}
              onClick={async () => {
                await session.signInAs(DEMO_USER_IDS.admin);
                navigate(`/admin/zadosti/${application.id}`);
              }}
            >
              Vyzkoušet posouzení jako administrace
            </Button>
          }
        >
          Než přihlášku někdo posoudí, nemůžeš vypisovat termíny ani vidět rezervace. V ukázce si posouzení můžeš vyzkoušet sám/sama
          v roli administrace.
        </Alert>
      )}
      {application.status === 'approved' && (
        <Alert tone="success" title="Přihláška je schválená" action={<ButtonLink to="/odbornik" size="sm" icon={<ArrowRight aria-hidden className="size-4" />}>Přejít na přehled</ButtonLink>}>
          Můžeš vypisovat termíny a upravit svůj veřejný profil. Schválení je v prototypu fiktivní.
        </Alert>
      )}
      {application.status === 'rejected' && (
        <Alert tone="error" title="Přihláška byla zamítnuta">
          {application.reviewerMessage ?? 'Bez uvedení důvodu.'}
        </Alert>
      )}
      <Card as="section" aria-labelledby="summary-title">
        <SectionTitle id="summary-title">
          <span className="inline-flex items-center gap-2">
            <FileText aria-hidden className="size-5 text-brand-700" /> Odeslané údaje
          </span>
        </SectionTitle>
        <dl className="divide-y divide-line">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="text-sm leading-relaxed">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">
          {application.submittedAt ? `Odesláno ${formatTimestamp(application.submittedAt)}` : ''}
          {application.decidedAt ? ` · Rozhodnuto ${formatTimestamp(application.decidedAt)}` : ''}
        </p>
      </Card>
    </div>
  );
}
