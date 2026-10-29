/**
 * Centrální konfigurace aplikace.
 *
 * Název a základní texty se mění pouze zde. Klíč pro localStorage je záměrně
 * oddělený od názvu, aby přejmenování aplikace nesmazalo uložená demo data.
 */

export type UrgentAudience = 'everyone' | 'youth' | 'adults' | 'parents' | 'violence';

export interface UrgentContact {
  /** Název služby, např. linka nebo krizové centrum. */
  name: string;
  /** Telefon nebo jiný kontakt ve formátu, jak se má zobrazit. */
  contact: string;
  /** Pro koho a kdy je kontakt určený. */
  description: string;
  /** Pro koho je kontakt hlavně určený (pro seskupení na stránce). */
  audience: UrgentAudience;
  /** Odkaz (tel:, https:), pokud se má kontakt zobrazit jako odkaz. */
  href?: string;
  /** Doplňkový odkaz, např. web nebo chat linky. */
  web?: { label: string; href: string };
}

export const appConfig = {
  /** Pracovní název aplikace. */
  name: 'Mezi',
  tagline: 'Prostor pro to, co právě řešíš.',
  description:
    'Demonstrační prototyp neziskové služby, která propojuje lidi hledající podporu s psychology nabízejícími bezplatné konzultace.',

  /** Prefix klíčů v localStorage. Změna prefixu znamená nová, prázdná demo data. */
  storageKey: 'mezi-demo',

  locale: 'cs-CZ',
  timeZone: 'Europe/Prague',

  /** Nejnižší věk klientů. Dospívající (minimumAge až adultAge − 1) vidí jen odborníky, kteří s nimi pracují. */
  minimumAge: 15,
  adultAge: 18,

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

  location: {
    /** Do jaké vzdálenosti (vzdušnou čarou mezi středy měst) považujeme odborníka za „v okolí“. */
    nearbyRadiusKm: 50,
  },

  urgentHelp: {
    /** Jednotné evropské číslo tísňového volání. */
    emergencyNumber: '112',
    /**
     * Krizové kontakty. Čísla jsou ověřená podle veřejně dostupných zdrojů
     * (gov.cz, Ministerstvo vnitra, weby linek) k datu níže. Před skutečným
     * spuštěním je musí potvrdit odborný garant služby.
     */
    contactsCheckedAt: '29. 10. 2026',
    verifiedContacts: [
      {
        name: 'Tísňové volání',
        contact: '112',
        href: 'tel:112',
        audience: 'everyone',
        description: 'Při bezprostředním ohrožení života nebo zdraví. Nonstop, zdarma.',
      },
      {
        name: 'Zdravotnická záchranná služba',
        contact: '155',
        href: 'tel:155',
        audience: 'everyone',
        description: 'Když jde o zdraví a je potřeba rychlá lékařská pomoc. Nonstop, zdarma.',
      },
      {
        name: 'Linka bezpečí',
        contact: '116 111',
        href: 'tel:116111',
        audience: 'youth',
        description: 'Pro děti, dospívající a studenty do 26 let. Nonstop, zdarma a anonymně. Nemusíš říkat, kdo jsi.',
        web: { label: 'Chat a e-mail na linkabezpeci.cz', href: 'https://www.linkabezpeci.cz' },
      },
      {
        name: 'Linka první psychické pomoci',
        contact: '116 123',
        href: 'tel:116123',
        audience: 'adults',
        description: 'Krizová pomoc pro dospělé. Nonstop a zdarma, nabízí i chat.',
        web: { label: 'linkapsychickepomoci.cz', href: 'https://www.linkapsychickepomoci.cz' },
      },
      {
        name: 'Linka pro rodinu a školu',
        contact: '116 000',
        href: 'tel:116000',
        audience: 'parents',
        description: 'Pro rodiče, učitele a další dospělé, kteří mají starost o dítě nebo studenta. Nonstop, zdarma.',
      },
      {
        name: 'Rodičovská linka',
        contact: '606 021 021',
        href: 'tel:606021021',
        audience: 'parents',
        description: 'Poradenství pro rodiče a blízké dětí a dospívajících (provozuje Linka bezpečí).',
      },
      {
        name: 'Linka pomoci obětem trestných činů a domácího násilí',
        contact: '116 006',
        href: 'tel:116006',
        audience: 'violence',
        description: 'Pro lidi, kteří zažívají násilí nebo se stali obětí trestného činu. Zdarma.',
      },
    ] as UrgentContact[],
  },
} as const;

export type AppConfig = typeof appConfig;
