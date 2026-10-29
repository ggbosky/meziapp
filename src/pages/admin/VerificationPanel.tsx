import { CircleCheck, CircleX, FileText, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useServices } from '../../app/AppContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../components/ui/cn';
import { FieldError } from '../../components/ui/Field';
import { SectionTitle } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { formatTimestamp } from '../../domain/time';
import type { PsychologistApplication, VerificationItem, VerificationStatus } from '../../domain/types';
import { allDeclared, DOCUMENT_KINDS, VERIFICATION_INFO, VERIFICATION_ITEMS, verifiedCount } from '../../domain/verification';
import { VERIFICATION_STATUS_STYLE } from '../professional/VerificationProgress';

function ItemRow({ app, item, editable }: { app: PsychologistApplication; item: VerificationItem; editable: boolean }) {
  const { admin } = useServices();
  const toast = useToast();
  const check = app.verification[item];
  const [note, setNote] = useState(check.note);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const info = VERIFICATION_INFO[item];
  const style = VERIFICATION_STATUS_STYLE[check.status];

  const evidence =
    item === 'education'
      ? app.documents.filter((d) => d.kind === 'diploma' || d.kind === 'training')
      : item === 'registry'
        ? app.documents.filter((d) => d.kind === 'registry')
        : [];

  const save = async (status: VerificationStatus) => {
    if (pending) return;
    setPending(true);
    const result = await admin.setVerification(app.id, item, status, note);
    setPending(false);
    if (result.ok) {
      setError(null);
      toast(status === 'verified' ? `Ověřeno: ${info.title.toLowerCase()}.` : status === 'rejected' ? 'Zaznamenáno, že údaj nesouhlasí.' : 'Bod je znovu k ověření.');
    } else setError(result.error.fieldErrors?.note ?? result.error.message);
  };

  return (
    <li className="rounded-2xl bg-canvas p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold">{info.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">{info.adminHint}</p>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5', style.className)}>
          {style.icon}
          {style.label}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 text-sm">
        {item === 'registry' && (
          <p>
            Uvedené číslo: <strong className="font-semibold">{app.registryNumber || 'neuvedeno'}</strong>
          </p>
        )}
        {item === 'declarations' && (
          <p>{allDeclared(app.declarations) ? 'Všechna prohlášení jsou potvrzená.' : 'Některá prohlášení chybí.'}</p>
        )}
        {evidence.map((d) => (
          <p key={d.id} className="flex items-center gap-2">
            <FileText aria-hidden className="size-4 shrink-0 text-brand-700" />
            <span className="truncate">{d.fileName}</span>
            <span className="text-xs text-muted">({DOCUMENT_KINDS.find((k) => k.kind === d.kind)?.label})</span>
          </p>
        ))}
        {(item === 'education' || item === 'registry') && evidence.length === 0 && <p className="text-muted">Žádný přiložený doklad.</p>}
        {check.checkedAt && (
          <p className="text-xs text-muted">
            Naposledy {formatTimestamp(check.checkedAt)} · {admin.getUserName(check.checkedBy ?? '')}
          </p>
        )}
      </div>

      {editable && (
        <div className="mt-3">
          <label className="sr-only" htmlFor={`note-${item}`}>
            Poznámka k ověření: {info.title}
          </label>
          <textarea
            id={`note-${item}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Jak a kde jsi údaj ověřil(a), nebo co nesouhlasí"
            className="block w-full rounded-[14px] border-2 border-line bg-surface px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15"
          />
          {error && <FieldError id={`note-${item}-error`} message={error} />}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" loading={pending} disabled={check.status === 'verified'} icon={<CircleCheck aria-hidden className="size-4" />} onClick={() => void save('verified')}>
              Ověřeno
            </Button>
            <Button size="sm" variant="secondary" className="text-danger-strong" disabled={pending} icon={<CircleX aria-hidden className="size-4" />} onClick={() => void save('rejected')}>
              Nesouhlasí
            </Button>
            {check.status !== 'pending' && (
              <Button size="sm" variant="ghost" disabled={pending} icon={<RotateCcw aria-hidden className="size-4" />} onClick={() => void save('pending')}>
                Vrátit k ověření
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/** Kontrolní seznam ověření odborníka v administraci. */
export function VerificationPanel({ app }: { app: PsychologistApplication }) {
  const editable = app.status === 'submitted' || app.status === 'needs_changes';
  const done = verifiedCount(app.verification);
  return (
    <Card as="section" aria-labelledby="verification-title">
      <SectionTitle
        id="verification-title"
        description={
          editable
            ? 'Každý bod ověř podle dokladů a veřejných registrů. Schválit lze až po ověření všech bodů.'
            : 'O přihlášce už je rozhodnuto, výsledky ověření jsou jen pro čtení.'
        }
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1 text-sm font-semibold text-brand-800">
            <ShieldCheck aria-hidden className="size-4" />
            {done} / {VERIFICATION_ITEMS.length}
          </span>
        }
      >
        Ověření odbornosti
      </SectionTitle>
      <ul className="space-y-3">
        {VERIFICATION_ITEMS.map((item) => (
          <ItemRow key={`${item}-${app.verification[item].checkedAt ?? 'none'}`} app={app} item={item} editable={editable} />
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Prototyp: doklady se nenahrávají a nic se neověřuje proti skutečným registrům. V ostrém provozu se totožnost ověří přes bankovní
        identitu a bezúhonnost výpisem z rejstříku trestů.
      </p>
    </Card>
  );
}
