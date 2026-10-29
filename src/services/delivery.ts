import type { ApplicationEmailPayload } from '../../api/applications';

export type { ApplicationEmailPayload };

export type DeliveryResult =
  | { status: 'sent' }
  /** Odesílání na této verzi aplikace není dostupné (např. náhled bez serveru). */
  | { status: 'unavailable'; message: string }
  | { status: 'invalid'; message: string; fieldErrors: Record<string, string> }
  | { status: 'failed'; message: string };

/** Doručení přihlášky odborníka provoznímu týmu. */
export interface ApplicationDelivery {
  send(payload: ApplicationEmailPayload): Promise<DeliveryResult>;
}

/** Odeslání přes serverovou funkci /api/applications (e-mail přes Resend). */
export function createHttpDelivery(url = '/api/applications', fetchImpl: typeof fetch = (...args) => fetch(...args)): ApplicationDelivery {
  return {
    async send(payload) {
      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        return { status: 'failed', message: 'Přihlášku se nepodařilo odeslat. Zkontroluj připojení k internetu a zkus to znovu.' };
      }
      const body = (await response.json().catch(() => null)) as { message?: string; fieldErrors?: Record<string, string> } | null;
      if (response.ok) return { status: 'sent' };
      if (response.status === 404 || response.status === 405 || response.status === 503) {
        return { status: 'unavailable', message: body?.message ?? 'Odesílání přihlášek e-mailem není na této verzi aplikace dostupné.' };
      }
      if (response.status === 413) {
        return { status: 'invalid', message: 'Přílohy jsou příliš velké.', fieldErrors: { documents: 'Doklady mohou mít dohromady nejvýš 3 MB.' } };
      }
      if (response.status === 422 || response.status === 400) {
        return { status: 'invalid', message: body?.message ?? 'Zkontroluj prosím zvýrazněná pole.', fieldErrors: body?.fieldErrors ?? {} };
      }
      return { status: 'failed', message: body?.message ?? 'Přihlášku se nepodařilo odeslat. Zkus to prosím za chvíli znovu.' };
    },
  };
}

/** Bez serveru: přihláška zůstane jen v ukázce v tomto prohlížeči. */
export const localOnlyDelivery: ApplicationDelivery = {
  async send() {
    return { status: 'unavailable', message: 'Odesílání přihlášek e-mailem není na této verzi aplikace zapnuté.' };
  },
};

/** Načte soubor jako base64 (bez prefixu data:). */
export function readFileAsBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Soubor nejde přečíst.'));
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });
}
