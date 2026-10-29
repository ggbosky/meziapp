import { ArrowLeft, Ban, CircleCheck, FileQuestion, Save, StickyNote } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAction, useDemoSnapshot, useServices } from '../../app/AppContext';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Alert } from '../../components/ui/Alert';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { TextArea } from '../../components/ui/Field';
import { PageHeader, SectionTitle } from '../../components/ui/PageHeader';
import { ApplicationStatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { languageLabel, specializationLabel } from '../../domain/catalog';
import { countLabel } from '../../domain/text';
import { cityById } from '../../domain/places';
import { formatTimestamp } from '../../domain/time';
import type { PsychologistApplication } from '../../domain/types';
import { INTERNAL_NOTE_MAX } from '../../domain/validation';
import { AuditList } from './AuditList';
import { ReasonDialog } from './ReasonDialog';

export function ApplicationDetailPage() {
  const { applicationId = '' } = useParams();
  const { admin } = useServices();
  useDemoSnapshot();
  const app = admin.getApplication(applicationId);
  usePageTitle(app ? `Přihláška: ${app.professionalName}` : 'Přihláška nenalezena');
  if (!app) {
    return <EmptyState title="Přihlášku jsme nenašli" action={<ButtonLink to="/admin/zadosti">Zpět na žádosti</ButtonLink>} />;
  }
  return <ApplicationDetail app={app} />;
}

function ApplicationDetail({ app }: { app: PsychologistApplication }) {
  const { admin } = useServices();
  const toast = useToast();
  const [dialog, setDialog] = useState<'approve' | 'changes' | 'reject' | null>(null);
  const [approve, approving] = useAction(admin.approve);
  const [approveError, setApproveError] = useState<string | null>(null);
  const events = admin.listAuditEvents().filter((e) => e.targetId === app.id || (app.profileId && e.targetId === app.profileId));
  const canDecide = app.status === 'submitted';

  const rows: Array<[string, string]> = [
    ['Profesní role', app.professionalRole],
    ['Shrnutí kvalifikace', app.qualificationSummary],
    ['Zaměření', app.specializations.map(specializationLabel).join(', ') || '—'],
    ['Jazyky', app.languages.map(languageLabel).join(', ') || '—'],
    ['Nabízená kapacita', `${countLabel(app.capacityPerMonth, 'konzultace', 'konzultace', 'konzultací')} měsíčně`],
    ['Profesní popis', app.bio],
    ['Město a forma', `${cityById(app.cityId)?.name ?? 'Neuvedeno'} · ${app.offersInPerson ? 'online i osobně' : 'jen online'}`],
    ['Dospívající klienti', app.worksWithYouth ? 'Pracuje i s dospívajícími' : 'Jen dospělí'],
    ['Demo účet', admin.getUserName(app.userId)],
  ];

  return (
    <div className="space-y-8">
      <Link to="/admin/zadosti" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-800 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Žádosti
      </Link>
      <PageHeader title={app.professionalName || 'Bez jména'} description="Fiktivní přihláška. Údaje nejsou ověřené." actions={<ApplicationStatusBadge status={app.status} />} />

      {app.reviewerMessage && (app.status === 'needs_changes' || app.status === 'rejected') && (
        <Alert tone={app.status === 'rejected' ? 'error' : 'warning'} title="Zpráva odeslaná žadateli">
          {app.reviewerMessage}
        </Alert>
      )}

      <Card as="section" aria-labelledby="data-title">
        <SectionTitle id="data-title">Údaje z přihlášky</SectionTitle>
        <dl className="divide-y divide-line">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="break-words text-sm leading-relaxed">{value || '—'}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">
          Vytvořeno {formatTimestamp(app.createdAt)}
          {app.submittedAt ? ` · odesláno ${formatTimestamp(app.submittedAt)}` : ''}
          {app.decidedAt ? ` · rozhodnuto ${formatTimestamp(app.decidedAt)}` : ''}
        </p>
      </Card>

      <Card as="section" aria-labelledby="decision-title">
        <SectionTitle id="decision-title" description={canDecide ? 'Rozhodnutí se zapíše do historie změn.' : 'O této přihlášce už je rozhodnuto nebo čeká na žadatele.'}>
          Rozhodnutí
        </SectionTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button disabled={!canDecide} icon={<CircleCheck aria-hidden className="size-4" />} onClick={() => setDialog('approve')}>
            Schválit
          </Button>
          <Button variant="secondary" disabled={!canDecide} icon={<FileQuestion aria-hidden className="size-4" />} onClick={() => setDialog('changes')}>
            Vyžádat doplnění
          </Button>
          <Button
            variant="secondary"
            className="text-danger-strong"
            disabled={app.status !== 'submitted' && app.status !== 'needs_changes'}
            icon={<Ban aria-hidden className="size-4" />}
            onClick={() => setDialog('reject')}
          >
            Zamítnout
          </Button>
        </div>
        {app.status === 'approved' && app.profileId && (
          <p className="mt-4 text-sm text-muted">
            Profil odborníka je vytvořený. Správa profilu: <Link to="/admin/profily" className="link">Profily</Link>
          </p>
        )}
      </Card>

      <InternalNote app={app} />

      <Card as="section" aria-labelledby="history-title">
        <SectionTitle id="history-title">Historie této přihlášky</SectionTitle>
        <AuditList events={events} actorName={admin.getUserName} />
      </Card>

      <ConfirmDialog
        open={dialog === 'approve'}
        onCancel={() => {
          setDialog(null);
          setApproveError(null);
        }}
        icon={<CircleCheck aria-hidden />}
        title={`Schválit přihlášku: ${app.professionalName}?`}
        description="Odborník získá přístup k vypisování termínů a jeho profil bude veřejně vidět."
        confirmLabel="Schválit přihlášku"
        loading={approving}
        onConfirm={async () => {
          const result = await approve(app.id);
          if (!result) return;
          if (result.ok) {
            setDialog(null);
            toast('Přihláška je schválená a profil je aktivní.');
          } else setApproveError(result.error.message);
        }}
      >
        Jde o simulaci: v prototypu se neověřují doklady ani identita.
        {approveError && (
          <Alert tone="error" live className="mt-3">
            {approveError}
          </Alert>
        )}
      </ConfirmDialog>
      <ReasonDialog
        open={dialog === 'changes'}
        onClose={() => setDialog(null)}
        icon={<FileQuestion aria-hidden />}
        title="Vyžádat doplnění přihlášky"
        description="Žadatel uvidí tuto zprávu a bude moct přihlášku upravit a znovu odeslat."
        label="Co je potřeba doplnit"
        hint="Piš věcně a stručně. Zpráva se zobrazí žadateli."
        confirmLabel="Odeslat žádost o doplnění"
        onSubmit={async (text) => {
          const result = await admin.requestChanges(app.id, text);
          if (result.ok) toast('Žádost o doplnění je odeslaná (v ukázce jen uložená).');
          return result;
        }}
      />
      <ReasonDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        icon={<Ban aria-hidden />}
        variant="danger"
        title="Zamítnout přihlášku?"
        description="Zamítnutou přihlášku už žadatel nemůže upravit."
        label="Zdůvodnění pro žadatele"
        hint="Zpráva se zobrazí žadateli."
        confirmLabel="Zamítnout přihlášku"
        onSubmit={async (text) => {
          const result = await admin.reject(app.id, text);
          if (result.ok) toast('Přihláška je zamítnutá.');
          return result;
        }}
      />
    </div>
  );
}

function InternalNote({ app }: { app: PsychologistApplication }) {
  const { admin } = useServices();
  const toast = useToast();
  const [note, setNote] = useState(app.internalNote);
  const [error, setError] = useState<string | undefined>();
  const [save, saving] = useAction(admin.updateInternalNote);
  return (
    <Card as="section" aria-labelledby="note-title">
      <SectionTitle id="note-title" description="Vidí ji jen administrace. Týká se výhradně přihlášky, nikdy zdravotního stavu klientů.">
        <span className="inline-flex items-center gap-2">
          <StickyNote aria-hidden className="size-5 text-brand-700" /> Interní provozní poznámka
        </span>
      </SectionTitle>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await save(app.id, note);
          if (!result) return;
          if (result.ok) {
            setError(undefined);
            toast('Poznámka je uložená.');
          } else setError(result.error.fieldErrors?.note ?? result.error.message);
        }}
      >
        <TextArea label="Poznámka k přihlášce" value={note} onChange={(e) => setNote(e.target.value)} maxChars={INTERNAL_NOTE_MAX} error={error} rows={3} />
        <Button type="submit" variant="secondary" loading={saving} disabled={note.trim() === app.internalNote} icon={<Save aria-hidden className="size-4" />}>
          Uložit poznámku
        </Button>
      </form>
    </Card>
  );
}
