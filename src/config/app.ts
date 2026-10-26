/**
 * Centrální konfigurace aplikace.
 *
 * Název a základní texty se mění pouze zde. Klíč pro localStorage je záměrně
 * oddělený od názvu, aby přejmenování aplikace nesmazalo uložená demo data.
 */

export interface UrgentContact {
  /** Název služby, např. linka nebo krizové centrum. */
  name: string;
  /** Telefon, web nebo jiný kontakt ve formátu, jak se má zobrazit. */
  contact: string;
  /** Pro koho a kdy je kontakt určený. */
  description: string;
  /** Odkaz (tel:, https:), pokud se má kontakt zobrazit jako odkaz. */
  href?: string;
}

export const appConfig = {
  /** Pracovní název aplikace. */
  name: 'Mezi',
  tagline: 'Prostor pro to, co právě řešíš.',
  description:
    'Demonstrační prototyp neziskové služby, která propojuje dospělé hledající podporu s psychology nabízejícími bezplatné konzultace.',

  /** Prefix klíčů v localStorage. Změna prefixu znamená nová, prázdná demo data. */
  storageKey: 'mezi-demo',

  locale: 'cs-CZ',
  timeZone: 'Europe/Prague',

  /** Služba je v první verzi určená pouze dospělým. */
  minimumAge: 18,

  /** Fiktivní kontaktní adresa provozovatele. */
  contactEmail: 'kontakt@example.com',

  booking: {
    /** Jak dlouho před začátkem lze termín ještě rezervovat. */
    leadTimeMinutes: 60,
    /** Kolik budoucích rezervací může mít jeden klient najednou (férové rozdělení kapacity). */
    maxActiveBookingsPerClient: 2,
    /** Jak daleko dopředu může odborník vypisovat termíny. */
    planningHorizonDays: 60,
    /** Povolené délky konzultace v minutách. */
    durations: [30, 50] as const,
  },

  urgentHelp: {
    /**
     * Jednotné evropské číslo tísňového volání. Jde o obecně známý údaj,
     * nikoli o kontakt vybraný provozovatelem služby.
     */
    emergencyNumber: '112',
    /**
     * Ověřené kontakty na krizovou pomoc. Před skutečným spuštěním je musí
     * doplnit a odborně ověřit garant služby. Prototyp záměrně žádné kontakty
     * nevymýšlí, proto je seznam prázdný.
     */
    verifiedContacts: [] as UrgentContact[],
  },
} as const;

export type AppConfig = typeof appConfig;
