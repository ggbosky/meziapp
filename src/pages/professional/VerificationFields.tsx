import { FileText, Paperclip, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Checkbox, FieldError, TextField } from '../../components/ui/Field';
import type { ApplicationDocument, Declarations, DocumentKind } from '../../domain/types';
import { checkDocumentFile, DECLARATIONS, DOCUMENT_KINDS, DOCUMENT_RULES } from '../../domain/verification';

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

/**
 * Část přihlášky pro ověření odbornosti. Soubory se v prototypu nikam
 * neodesílají ani nečtou: uloží se jen jejich název a velikost.
 */
export function VerificationFields({
  registryNumber,
  onRegistryNumber,
  documents,
  onDocuments,
  declarations,
  onDeclarations,
  errors,
}: {
  registryNumber: string;
  onRegistryNumber: (v: string) => void;
  documents: ApplicationDocument[];
  onDocuments: (v: ApplicationDocument[]) => void;
  declarations: Declarations;
  onDeclarations: (v: Declarations) => void;
  errors: Record<string, string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<DocumentKind>('diploma');
  const [fileError, setFileError] = useState<string | null>(null);
  const kindId = useId();

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = [...documents];
    for (const file of Array.from(files)) {
      const error = checkDocumentFile(file);
      if (error) {
        setFileError(`${file.name}: ${error}`);
        continue;
      }
      if (next.length >= DOCUMENT_RULES.maxFiles) {
        setFileError(`Přilož nejvýš ${DOCUMENT_RULES.maxFiles} dokladů.`);
        break;
      }
      next.push({
        id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        kind,
        fileName: file.name,
        sizeBytes: file.size,
        addedAt: new Date().toISOString(),
      });
      setFileError(null);
    }
    onDocuments(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <section aria-labelledby="verify-title" className="space-y-5 rounded-[20px] bg-sky-soft p-4 sm:p-5">
      <div>
        <h3 id="verify-title" className="text-lg font-extrabold">
          Ověření odbornosti
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-ink/75">
          Než se tvůj profil zobrazí klientům, ověříme totožnost, vzdělání v psychologii, profesní registraci a čestná prohlášení. Bez toho
          nelze vypisovat termíny.
        </p>
      </div>

      <div id="app-registryNumber" tabIndex={-1} className="outline-none">
        <TextField
          label="Číslo v profesním registru nebo číslo členství"
          value={registryNumber}
          onChange={(e) => onRegistryNumber(e.target.value)}
          hint="Například číslo v registru odborné společnosti nebo profesní organizace, ve které jsi členem. Administrace ho dohledá ve veřejném seznamu."
          error={errors.registryNumber}
          maxLength={40}
          autoComplete="off"
          required
        />
      </div>

      <div id="app-documents" tabIndex={-1} className="outline-none">
        <p className="mb-1.5 text-sm font-semibold">
          Doklady <span className="font-normal text-muted">(diplom je povinný)</span>
        </p>
        {documents.length > 0 && (
          <ul className="mb-3 space-y-2">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                <FileText aria-hidden className="size-5 shrink-0 text-brand-700" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{d.fileName}</span>
                  <span className="block text-xs text-muted">
                    {DOCUMENT_KINDS.find((k) => k.kind === d.kind)?.label} · {formatSize(d.sizeBytes)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onDocuments(documents.filter((x) => x.id !== d.id))}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-danger hover:bg-danger-soft"
                  aria-label={`Odebrat ${d.fileName}`}
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={kindId} className="sr-only">
            Typ dokladu
          </label>
          <select
            id={kindId}
            value={kind}
            onChange={(e) => setKind(e.target.value as DocumentKind)}
            className="min-h-12 flex-1 rounded-[14px] border-2 border-line bg-surface px-3 text-sm font-semibold focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15"
          >
            {DOCUMENT_KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
          </select>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-brand-800 px-5 text-sm font-semibold text-white hover:bg-brand-900 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600">
            <Paperclip aria-hidden className="size-4" />
            Přiložit soubor
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              multiple
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
        </div>
        <p className="mt-1.5 text-[0.8rem] text-muted">PDF, JPG nebo PNG do 10 MB. V prototypu se soubor nikam neodesílá, uloží se jen jeho název.</p>
        {(fileError || errors.documents) && <FieldError id="documents-error" message={fileError ?? errors.documents!} />}
      </div>

      <fieldset id="app-declarations" tabIndex={-1} className="space-y-3 outline-none">
        <legend className="mb-1 text-sm font-semibold">Čestná prohlášení</legend>
        {DECLARATIONS.map((d) => (
          <Checkbox
            key={d.key}
            checked={declarations[d.key]}
            onChange={(v) => onDeclarations({ ...declarations, [d.key]: v })}
            label={d.label}
          />
        ))}
        {errors.declarations && <FieldError id="declarations-error" message={errors.declarations} />}
      </fieldset>

      <p className="text-[0.8rem] leading-relaxed text-ink/70">
        Totožnost se v ostrém provozu ověří přes bankovní identitu nebo Identitu občana. V prototypu ji jen simulovaně potvrdí administrace.
      </p>
    </section>
  );
}
