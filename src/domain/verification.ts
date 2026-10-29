import type { Declarations, DocumentKind, VerificationCheck, VerificationItem } from './types';

/**
 * Ověřování odborníků. Žádný odborník nemůže vypisovat termíny, dokud
 * administrace neověří všechny body níže. V prototypu je ověření simulované:
 * dokumenty se nikam neodesílají a nic se nekontroluje proti skutečným registrům.
 */

export const VERIFICATION_ITEMS: readonly VerificationItem[] = ['identity', 'education', 'registry', 'declarations'];

export const VERIFICATION_INFO: Record<VerificationItem, { title: string; adminHint: string; publicLabel: string }> = {
  identity: {
    title: 'Totožnost',
    adminHint: 'Jméno odpovídá dokladům. V ostrém provozu přes bankovní identitu nebo Identitu občana.',
    publicLabel: 'Totožnost',
  },
  education: {
    title: 'Vzdělání v psychologii',
    adminHint: 'Diplom z jednooborového magisterského studia psychologie, jméno sedí s totožností.',
    publicLabel: 'Vzdělání v psychologii',
  },
  registry: {
    title: 'Registrace nebo členství',
    adminHint: 'Číslo v profesním registru nebo členství v profesní organizaci dohledané ve veřejném seznamu.',
    publicLabel: 'Profesní registrace',
  },
  declarations: {
    title: 'Čestná prohlášení',
    adminHint: 'Všechna prohlášení jsou potvrzená; bezúhonnost v ostrém provozu doložená výpisem z rejstříku trestů.',
    publicLabel: 'Bezúhonnost a etický kodex',
  },
};

export const DOCUMENT_KINDS: ReadonlyArray<{ kind: DocumentKind; label: string; required: boolean }> = [
  { kind: 'diploma', label: 'Diplom (magisterské studium psychologie)', required: true },
  { kind: 'registry', label: 'Doklad o registraci nebo členství', required: false },
  { kind: 'training', label: 'Osvědčení o výcviku nebo specializaci', required: false },
];

export const DECLARATIONS: ReadonlyArray<{ key: keyof Declarations; label: string }> = [
  { key: 'truthful', label: 'Údaje v přihlášce jsou pravdivé a přiložené doklady patří mně.' },
  { key: 'integrity', label: 'Jsem bezúhonný/á. Na vyžádání doložím výpis z rejstříku trestů.' },
  { key: 'ethics', label: 'Budu dodržovat etický kodex psychologické práce a mlčenlivost.' },
  { key: 'supervision', label: 'Mám k dispozici supervizi nebo odbornou konzultaci.' },
];

export const DOCUMENT_RULES = {
  maxBytes: 10 * 1024 * 1024,
  extensions: ['pdf', 'jpg', 'jpeg', 'png'],
  maxFiles: 6,
} as const;

/** Jak dlouho platí ověření odborníka, než je potřeba ho zopakovat. */
export const VERIFICATION_VALIDITY_DAYS = 365;

export function emptyDeclarations(): Declarations {
  return { truthful: false, integrity: false, ethics: false, supervision: false };
}

export function allDeclared(d: Declarations): boolean {
  return d.truthful && d.integrity && d.ethics && d.supervision;
}

export function pendingVerification(): Record<VerificationItem, VerificationCheck> {
  const check = (): VerificationCheck => ({ status: 'pending', note: '', checkedAt: null, checkedBy: null });
  return { identity: check(), education: check(), registry: check(), declarations: check() };
}

export function isFullyVerified(v: Record<VerificationItem, VerificationCheck>): boolean {
  return VERIFICATION_ITEMS.every((item) => v[item].status === 'verified');
}

export function verifiedCount(v: Record<VerificationItem, VerificationCheck>): number {
  return VERIFICATION_ITEMS.filter((item) => v[item].status === 'verified').length;
}

/** Kontrola souboru před přiložením. Vrací chybu, nebo null. */
export function checkDocumentFile(file: { name: string; size: number }): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!(DOCUMENT_RULES.extensions as readonly string[]).includes(ext)) return 'Přilož prosím soubor PDF, JPG nebo PNG.';
  if (file.size <= 0) return 'Soubor je prázdný.';
  if (file.size > DOCUMENT_RULES.maxBytes) return 'Soubor je větší než 10 MB.';
  return null;
}
