import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST, validatePayload, type ApplicationEmailPayload } from './applications';

const PDF = btoa('%PDF-1.4 fiktivní diplom');

function payload(overrides: Partial<ApplicationEmailPayload> = {}): ApplicationEmailPayload {
  return {
    professionalName: 'Testovací Odbornice',
    professionalRole: 'Psycholožka',
    contactEmail: 'odbornice@example.com',
    qualificationSummary: 'Fiktivní shrnutí kvalifikace, které je dost dlouhé.',
    specializations: ['Úzkost a stres'],
    languages: ['Čeština'],
    capacityPerMonth: 4,
    bio: 'Fiktivní profesní popis, který má dostatek znaků.',
    city: 'Brno',
    offersInPerson: true,
    worksWithYouth: false,
    registryNumber: 'DEMO-1234',
    declarations: { truthful: true, integrity: true, ethics: true, supervision: true },
    consent: true,
    files: [{ kind: 'diploma', fileName: 'diplom.pdf', contentBase64: PDF }],
    website: '',
    ...overrides,
  };
}

const request = (body: unknown) =>
  new Request('https://example.com/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('serverová funkce pro přihlášky', () => {
  it('přijme úplnou přihlášku', () => {
    expect(validatePayload(payload()).ok).toBe(true);
  });

  it('odmítne chybějící souhlas, diplom a podvržený soubor', () => {
    const result = validatePayload(
      payload({ consent: false, files: [{ kind: 'diploma', fileName: 'diplom.pdf', contentBase64: btoa('<script>alert(1)</script>') }] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.consent).toBeTruthy();
      expect(result.errors.documents).toMatch(/neodpovídá/);
    }
    const noDiploma = validatePayload(payload({ files: [{ kind: 'training', fileName: 'kurz.pdf', contentBase64: PDF }] }));
    expect(!noDiploma.ok && noDiploma.errors.documents).toBeTruthy();
  });

  it('bez nastavení vrátí 503 a nic neposílá', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request(payload()));
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pošle e-mail s přílohou a ošetřeným HTML', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubEnv('APPLICATION_TO_EMAIL', 'tym@example.com');
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request(payload({ professionalName: 'Jana <b>Nová</b>' })));
    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0]!;
    const sent = JSON.parse(init.body);
    expect(sent.to).toEqual(['tym@example.com']);
    expect(sent.reply_to).toBe('odbornice@example.com');
    expect(sent.attachments[0].filename).toBe('diplom.pdf');
    expect(sent.html).toContain('Jana &lt;b&gt;Nová&lt;/b&gt;');
    expect(init.headers.Authorization).toBe('Bearer test-key');
  });

  it('robota (vyplněné skryté pole) tiše odmítne', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubEnv('APPLICATION_TO_EMAIL', 'tym@example.com');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(request(payload({ website: 'spam' })));
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('chybné údaje vrátí 422 s chybami polí', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubEnv('APPLICATION_TO_EMAIL', 'tym@example.com');
    vi.stubGlobal('fetch', vi.fn());
    const response = await POST(request(payload({ contactEmail: 'neplatny' })));
    expect(response.status).toBe(422);
    expect((await response.json()).fieldErrors.contactEmail).toBeTruthy();
  });
});
