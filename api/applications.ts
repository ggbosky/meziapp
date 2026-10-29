/**
 * Serverová funkce (Vercel): přijme přihlášku odborníka a odešle ji e-mailem
 * provoznímu týmu přes službu Resend. Klíč ke službě zůstává na serveru.
 *
 * Proměnné prostředí (nastavují se ve Vercelu, ne v kódu):
 * - RESEND_API_KEY        klíč ke službě Resend
 * - APPLICATION_TO_EMAIL  kam přihlášky chodí (může být víc adres oddělených čárkou)
 * - APPLICATION_FROM_EMAIL odesílatel, např. "Mezi <prihlasky@vase-domena.cz>";
 *                          bez ověřené domény lze použít "Mezi <onboarding@resend.dev>"
 *
 * Soubor je záměrně samostatný (bez importů z aplikace), aby šel na Vercelu
 * spolehlivě sestavit. Kontroly vstupu odpovídají validaci v aplikaci.
 */

const MAX_FILES = 6;
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_BYTES = 3 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const DOCUMENT_LABELS: Record<string, string> = {
  diploma: 'Diplom',
  registry: 'Doklad o registraci nebo členství',
  training: 'Osvědčení o výcviku',
};

export interface ApplicationEmailPayload {
  professionalName: string;
  professionalRole: string;
  contactEmail: string;
  qualificationSummary: string;
  specializations: string[];
  languages: string[];
  capacityPerMonth: number;
  bio: string;
  city: string | null;
  offersInPerson: boolean;
  worksWithYouth: boolean;
  registryNumber: string;
  declarations: { truthful: boolean; integrity: boolean; ethics: boolean; supervision: boolean };
  consent: boolean;
  files: Array<{ kind: string; fileName: string; contentBase64: string }>;
  /** Past na roboty: skryté pole, které člověk nevyplní. */
  website?: string;
}

type FieldErrors = Record<string, string>;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

const isString = (v: unknown): v is string => typeof v === 'string';

function textLength(v: unknown): number {
  return isString(v) ? v.trim().length : -1;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Ověří obsah souboru podle prvních bajtů (nespoléhá jen na příponu). */
function hasValidSignature(ext: string, bytes: Uint8Array): boolean {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (ext === 'pdf') return starts([0x25, 0x50, 0x44, 0x46]);
  if (ext === 'png') return starts([0x89, 0x50, 0x4e, 0x47]);
  return starts([0xff, 0xd8, 0xff]);
}

function decodeBase64(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
  try {
    return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

export function validatePayload(input: unknown): { ok: true; value: ApplicationEmailPayload } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  if (typeof input !== 'object' || input === null) return { ok: false, errors: { form: 'Neplatná data přihlášky.' } };
  const p = input as Record<string, unknown>;

  const text = (key: string, min: number, max: number, label: string) => {
    const len = textLength(p[key]);
    if (len < min || len > max) errors[key] = `${label}: ${min}–${max} znaků.`;
  };
  text('professionalName', 3, 80, 'Profesní jméno');
  text('professionalRole', 2, 60, 'Profesní role');
  text('qualificationSummary', 30, 1000, 'Shrnutí kvalifikace');
  text('bio', 30, 800, 'Profesní popis');
  text('registryNumber', 3, 40, 'Číslo registrace');
  if (!isString(p.contactEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.contactEmail.trim()) || p.contactEmail.length > 120) {
    errors.contactEmail = 'Zadej platný e-mail.';
  }
  const list = (key: string, max: number) =>
    Array.isArray(p[key]) && (p[key] as unknown[]).length > 0 && (p[key] as unknown[]).length <= max && (p[key] as unknown[]).every((x) => isString(x) && x.length <= 40);
  if (!list('specializations', 8)) errors.specializations = 'Vyber aspoň jedno zaměření.';
  if (!list('languages', 5)) errors.languages = 'Vyber aspoň jeden jazyk.';
  const capacity = p.capacityPerMonth;
  if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 1 || capacity > 40) errors.capacityPerMonth = 'Kapacita 1–40.';
  if (!(p.city === null || (isString(p.city) && p.city.length <= 60))) errors.city = 'Neplatné město.';
  if (typeof p.offersInPerson !== 'boolean' || typeof p.worksWithYouth !== 'boolean') errors.form = 'Neplatná data přihlášky.';
  const d = p.declarations as Record<string, unknown> | undefined;
  if (!d || !['truthful', 'integrity', 'ethics', 'supervision'].every((k) => d[k] === true)) errors.declarations = 'Potvrď všechna prohlášení.';
  if (p.consent !== true) errors.consent = 'Bez souhlasu se zpracováním údajů přihlášku nemůžeme přijmout.';

  const files = p.files;
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_FILES) {
    errors.documents = 'Přilož diplom (nejvýš 6 souborů).';
  } else {
    let total = 0;
    for (const f of files as Array<Record<string, unknown>>) {
      const name = isString(f.fileName) ? f.fileName : '';
      const ext = name.split('.').pop()?.toLowerCase() ?? '';
      const bytes = isString(f.contentBase64) ? decodeBase64(f.contentBase64) : null;
      if (!isString(f.kind) || !(f.kind in DOCUMENT_LABELS) || !name || name.length > 120 || !ALLOWED_EXTENSIONS.includes(ext) || !bytes) {
        errors.documents = 'Některý doklad má nepodporovaný formát. Povolené jsou PDF, JPG a PNG.';
        break;
      }
      if (bytes.length > MAX_FILE_BYTES) {
        errors.documents = `Soubor ${name} je větší než 3 MB.`;
        break;
      }
      if (!hasValidSignature(ext, bytes)) {
        errors.documents = `Soubor ${name} neodpovídá svému formátu.`;
        break;
      }
      total += bytes.length;
    }
    if (!errors.documents && total > MAX_TOTAL_BYTES) errors.documents = 'Doklady mají dohromady víc než 3 MB.';
    if (!errors.documents && !(files as Array<Record<string, unknown>>).some((f) => f.kind === 'diploma')) {
      errors.documents = 'Přilož prosím diplom.';
    }
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: p as unknown as ApplicationEmailPayload };
}

export function renderEmail(p: ApplicationEmailPayload): { subject: string; html: string; text: string } {
  const rows: Array<[string, string]> = [
    ['Profesní jméno', p.professionalName],
    ['Profesní role', p.professionalRole],
    ['Kontaktní e-mail', p.contactEmail],
    ['Číslo registrace / členství', p.registryNumber],
    ['Shrnutí kvalifikace', p.qualificationSummary],
    ['Zaměření', p.specializations.join(', ')],
    ['Jazyky', p.languages.join(', ')],
    ['Kapacita', `${p.capacityPerMonth} konzultací měsíčně`],
    ['Město a forma', `${p.city ?? 'neuvedeno'} · ${p.offersInPerson ? 'online i osobně' : 'jen online'}`],
    ['Dospívající klienti', p.worksWithYouth ? 'ano' : 'ne'],
    ['Profesní popis', p.bio],
    ['Čestná prohlášení', 'všechna potvrzena'],
    ['Přílohy', p.files.map((f) => `${DOCUMENT_LABELS[f.kind]}: ${f.fileName}`).join('; ')],
  ];
  const subject = `Nová přihláška odborníka: ${p.professionalName.trim()}`;
  const html = `<div style="font-family:Arial,sans-serif;color:#16312a;max-width:640px">
<h2 style="margin:0 0 12px">Nová přihláška odborníka</h2>
<p style="color:#55675d">Před schválením ověř totožnost, vzdělání, registraci a prohlášení. Přílohy jsou připojené k tomuto e-mailu.</p>
<table style="border-collapse:collapse;width:100%">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #e2ebe4;color:#55675d;vertical-align:top;width:34%">${escapeHtml(k)}</td><td style="padding:8px;border-bottom:1px solid #e2ebe4;white-space:pre-wrap">${escapeHtml(v.trim())}</td></tr>`,
    )
    .join('')}</table></div>`;
  const text = `Nová přihláška odborníka\n\n${rows.map(([k, v]) => `${k}: ${v.trim()}`).join('\n')}`;
  return { subject, html, text };
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.APPLICATION_TO_EMAIL;
  const from = process.env.APPLICATION_FROM_EMAIL || 'Mezi <onboarding@resend.dev>';
  if (!apiKey || !to) {
    return json(503, { ok: false, code: 'NOT_CONFIGURED', message: 'Odesílání přihlášek e-mailem zatím není nastavené.' });
  }

  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > 4_400_000) return json(413, { ok: false, code: 'TOO_LARGE', message: 'Přihláška s přílohami je příliš velká (nejvýš 3 MB příloh).' });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, code: 'INVALID', message: 'Neplatná data přihlášky.' });
  }

  // Robot vyplnil skryté pole: tváříme se úspěšně, ale nic neposíláme.
  if (typeof body === 'object' && body !== null && isString((body as Record<string, unknown>).website) && (body as Record<string, string>).website !== '') {
    return json(200, { ok: true });
  }

  const result = validatePayload(body);
  if (!result.ok) return json(422, { ok: false, code: 'INVALID', message: 'Zkontroluj prosím zvýrazněná pole.', fieldErrors: result.errors });

  const p = result.value;
  const email = renderEmail(p);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: to.split(',').map((s) => s.trim()).filter(Boolean),
      reply_to: p.contactEmail.trim(),
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: p.files.map((f) => ({ filename: f.fileName, content: f.contentBase64 })),
    }),
  });
  if (!response.ok) {
    console.error('Resend odmítl e-mail', response.status, await response.text().catch(() => ''));
    return json(502, { ok: false, code: 'SEND_FAILED', message: 'Přihlášku se nepodařilo odeslat. Zkus to prosím za chvíli znovu.' });
  }
  return json(200, { ok: true });
}
