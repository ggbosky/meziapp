# Mezi — demonstrační prototyp

Prototyp neziskové aplikace pro objednávání **bezplatných konzultací u psychologů**. Propojuje dospělé hledající podporu s psychology, kteří nabízejí část své kapacity zdarma.

> **Jde výhradně o DEMONSTRAČNÍ PROTOTYP.** Všechny osoby, kvalifikace, termíny, rezervace i výsledky schvalování jsou fiktivní. Aplikace nemá backend, neposílá e-maily, nezakládá videohovory a nesbírá analytická data.

Principy služby: všechny konzultace jsou zdarma, bez předplatného, kreditů, reklam a placeného předbíhání. Pro všechny platí stejné podmínky, odborníci prochází ručním schválením a kapacita je omezená. Služba neslibuje léčbu ani nepřetržitou dostupnost a nenahrazuje akutní pomoc. Je určená lidem od 15 let: dospívající (15–17) vidí jen odborníky označené „Pracuje s dospívajícími“ (hranice jsou v `src/config/app.ts`).

## Technologie

React 19, TypeScript (strict), Vite, Tailwind CSS 4, React Router (HashRouter), ikony Lucide, Vitest a Testing Library. Písma Nunito (nadpisy) a Figtree (text) jsou self-hostovaná přes Fontsource, takže se nic nenačítá z cizích serverů. Rozhraní je navržené primárně pro telefon: dolní lišta s kartami podle role, na počítači boční panel. Ilustrace jsou vlastní SVG v `src/components/ui/Illustrations.tsx`.

Název aplikace se mění na jednom místě: `src/config/app.ts` (`appConfig.name`). Logo je v `src/assets/brand/` (značka `mezi-mark.png` a celé logo `mezi-logo.png`, obojí s průhledným pozadím) a ikony aplikace v `public/` (`favicon.png`, `apple-touch-icon.png`). V hlavičce se ke značce vypisuje název z konfigurace, takže přejmenování logo nerozbije. Tamtéž jsou texty, pravidla rezervací a místo pro ověřené krizové kontakty.

## Instalace a lokální spuštění

Potřebuješ Node.js 20.19 nebo novější (doporučeno 22).

```bash
npm install
npm run dev        # vývojový server na http://localhost:5173
```

## Build, preview a kontroly

```bash
npm run build      # kontrola TypeScriptu + produkční build do dist/
npm run preview    # náhled sestavené aplikace na http://localhost:4173
npm run typecheck  # pouze kontrola TypeScriptu
npm test           # testy datové logiky a průchodů rozhraním
npm run check      # vše najednou: typecheck, testy, build
```

## Připravené demo účty

Na stránce **Vyzkoušet aplikaci** (`#/vyzkouset`) se vstupuje do fiktivních účtů bez hesla:

| Role | Účet | Co ukazuje |
| --- | --- | --- |
| Klient | Tereza Malá | poloha Kladno (vidí psychology v okolí), jedna naplánovaná konzultace, proběhlé konzultace (jedna čeká na zpětnou vazbu), zrušená rezervace |
| Klient | Ondřej Král | naplánovaná konzultace, konzultace zrušená odborníkem, bez zadané polohy |
| Klient (16 let) | Ema Svobodová | dospívající klientka z Brna, vidí jen odborníky pro dospívající |
| Schválený psycholog | Alžběta Krejčí | vypsané termíny, rezervace, týdenní rozvrh |
| Schválený psycholog | Vojtěch Pokorný | večerní termíny, jedna rezervace |
| Žadatel | Kateřina Holubová | odeslaná přihláška čekající na posouzení |
| Žadatel | Lenka Dušková | zatím nevyplněná přihláška |
| Administrátor | Provozní administrace | žádosti, profily, rezervace, statistiky, historie změn |

Výchozí data dál obsahují pět schválených psychologů (jeden z nich, Daniel Říha, nemá volné termíny), jeden profil pozastavený administrací (Filip Novotný), dvě přihlášky čekající na posouzení, jednu zamítnutou, termíny na příštích 14 dní a ukázkovou historii administrativních změn. Všechny e-maily jsou na doméně `example.com`.

### Přepínání rolí NENÍ zabezpečení

Vstup do demo účtů je nástroj prototypu, ne přihlášení. Simulovaná oprávnění se uplatňují v rozhraní i v datové vrstvě (klient vidí jen své rezervace, psycholog jen rezervace ke svým termínům, neschválený žadatel nemůže vypisovat termíny, administrativní akce jsou jen pro roli administrátora), aby prototyp působil realisticky. **Data tím ale nijak chráněna nejsou.** Všechna demo data leží v localStorage prohlížeče a návštěvník je může kdykoli přečíst nebo změnit. Testy filtrování podle rolí ověřují chování prototypu, nikoli bezpečnost.

### Doporučený průchod

1. Jako **klient** otevři *Psychologové*, vyfiltruj odborníka, vyber termín a projdi rezervaci (termín, rekapitulace, potvrzení, potvrzovací stránka).
2. V přehledu klienta otevři rezervaci, vyzkoušej demo připojení k hovoru a rezervaci zruš. Termín se znovu objeví v nabídce.
3. U proběhlé konzultace vyplň krátkou soukromou zpětnou vazbu.
4. Jako **psycholog** přidej termín, zkus i překrývající se termín (bude odmítnut), zruš volný termín, zruš rezervovaný termín a pozastav příjem rezervací.
5. Jako **žadatel s odeslanou přihláškou** ověř, že termíny ani rezervace nejsou dostupné. Tlačítkem přejdi do role administrace.
6. Jako **administrátor** přihlášku schval, vyžádej doplnění nebo zamítni a pozastav některý profil. Změny uvidíš v *Historii změn*.
7. Vrať se k žadateli: po schválení vidí přehled psychologa a může vypisovat termíny.
8. Tlačítkem **Obnovit demo** vrátíš výchozí stav.

## Ověřování odborníků

Aby se za psychologa nemohl vydávat kdokoli, prochází každý žadatel ověřením:

- **Žadatel dodá:** číslo v profesním registru nebo číslo členství v profesní organizaci, diplom (povinný), případně doklad o registraci a osvědčení o výcviku, a čtyři čestná prohlášení (pravdivost údajů, bezúhonnost, etický kodex a mlčenlivost, supervize). Bez nich přihlášku nejde odeslat.
- **Administrace ověří čtyři body:** totožnost, vzdělání v psychologii, registraci nebo členství a prohlášení. Každý bod označí „Ověřeno“ nebo „Nesouhlasí“ (s povinnou poznámkou). Všechny kroky se zapisují do historie změn.
- **Schválit lze až po ověření všech bodů.** Pravidlo hlídá datová vrstva (`admin.approve` jinak vrátí chybu `NOT_VERIFIED`), nejen tlačítko. Body, se kterými administrace nesouhlasila, se po doplnění přihlášky ověřují znovu.
- Neschválený žadatel nevidí rezervace ani nemůže vypisovat termíny. Ověření platí rok (`VERIFICATION_VALIDITY_DAYS` v `src/domain/verification.ts`); profil klientům ukazuje, co bylo ověřeno a do kdy.

V prototypu je ověření simulované: soubory se nikam neodesílají (uloží se jen název a velikost) a nic se nekontroluje proti skutečným registrům. Pro ostrý provoz je potřeba bezpečné úložiště dokladů, ověření totožnosti (bankovní identita nebo Identita občana), výpis z rejstříku trestů a s odborným garantem určit, proti kterým registrům a profesním organizacím se odbornost ověřuje.

## Odesílání přihlášek e-mailem

Odeslaná přihláška odborníka (včetně dokladů jako příloh) přijde e-mailem provoznímu týmu. Odesílá ji serverová funkce `api/applications.ts` na Vercelu přes službu [Resend](https://resend.com), takže klíč ke službě zůstává na serveru. Funkce znovu kontroluje všechny údaje, skutečný typ příloh podle obsahu (PDF, JPG, PNG, dohromady nejvýš 3 MB), vyžaduje souhlas se zpracováním údajů a má past na roboty.

Nastavení (Vercel → Project → Settings → Environment Variables, pak nové nasazení):

| Proměnná | Význam |
| --- | --- |
| `RESEND_API_KEY` | API klíč ze služby Resend |
| `APPLICATION_TO_EMAIL` | kam přihlášky chodí (víc adres oddělte čárkou) |
| `APPLICATION_FROM_EMAIL` | nepovinné; odesílatel, např. `Mezi <prihlasky@vase-domena.cz>`. Bez ověřené domény se použije `onboarding@resend.dev`, které umí posílat jen na e-mail účtu v Resendu. |

Dokud proměnné nejsou nastavené, funkce vrací 503 a aplikace přihlášku uloží jen v ukázce s jasným upozorněním. Na verzích bez serveru (náhled na claude.ai, GitHub Pages) se chová stejně.

## Poloha, osobní setkání a dospívající

- Klient může zadat nejbližší větší město (bez adresy). Přihlášenému klientovi se uloží k účtu, nepřihlášenému jen do prohlížeče. Seznam psychologů pak ukáže sekci „Ve tvém okolí“ (do 50 km vzdušnou čarou mezi středy měst, nastavitelné v konfiguraci) a u každého odborníka přibližnou vzdálenost.
- Odborník uvádí město praxe a jestli nabízí osobní setkání. U každého termínu volí formu: online, nebo osobně. Rezervace formu převezme; u osobního termínu se místo připojení k hovoru ukáže informace o setkání (adresa se v prototypu nesděluje).
- Klient při rezervaci uvede věkovou skupinu (18+, nebo 15–17). Dospívající si mohou rezervovat jen odborníky, kteří s dospívajícími pracují; pravidlo hlídá i datová vrstva.
- Seznam měst je v `src/domain/places.ts`.

## Ukládání a resetování dat

- Výchozí data se generují v `src/data/seed.ts` **relativně k aktuálnímu datu**, takže termíny jsou vždy na příštích 14 dní.
- Veškeré změny ukládá jediné centrální úložiště `src/storage/store.ts` do localStorage pod klíčem `mezi-demo:state`. Komponenty localStorage nikdy nečtou přímo.
- Uložená data mají verzi schématu (`src/storage/schemaVersion.ts`) a při načtení se validují (`src/storage/validate.ts`). Neplatná nebo nekompatibilní data se bezpečně nahradí výchozími a aplikace o tom zobrazí oznámení.
- Pokud localStorage není dostupné (například v anonymním režimu) nebo je zaplněné, aplikace funguje dál v paměti a zobrazí varování, že se změny neuloží.
- Změny se synchronizují mezi záložkami přes událost `storage`. Před každým zápisem se znovu načte aktuální uložený stav.
- **Obnovit demo** (v patičce, na stránce *Vyzkoušet aplikaci* a *O prototypu*) po potvrzení smaže změny a vygeneruje data znovu od dnešního dne. Pokud jsou data starší než 7 dní, aplikace obnovení sama nabídne.
- Časy se ukládají jednoznačně v UTC (ISO 8601 s `Z`) a zobrazují se v českém formátu v pásmu Europe/Prague bez ohledu na pásmo prohlížeče.

## Nasazení na Vercel

Aplikace běží na Vercelu (projekt napojený na tento repozitář). Nastavení je v `vercel.json`: framework Vite, build `npm run build`, výstup `dist`, dlouhé cachování neměnných souborů v `assets/` a bezpečnostní hlavičky. Aplikace nepotřebuje žádné proměnné prostředí ani serverové funkce; každý push do napojené větve se nasadí automaticky.

## Odolnost proti prázdné stránce

- `index.html` obsahuje kostru aplikace, která je vidět okamžitě, ještě než se stáhne JavaScript.
- Hlídač startu v `index.html` ukáže srozumitelnou zprávu s tlačítkem „Načíst znovu“, když se skript nepodaří načíst nebo se aplikace do 12 sekund nespustí. Velmi staré prohlížeče bez podpory modulů dostanou výzvu k aktualizaci.
- Build cílí i na starší prohlížeče (Safari 14, Chrome 87, Firefox 78), aby se aplikace na starších iPhonech nespustila jako prázdná stránka.
- Chyby při vykreslování zachytí `ErrorBoundary` (obdoba `error.js`): pro celou aplikaci a zvlášť pro obsah stránky, takže navigace zůstane funkční. Chybová obrazovka nabízí zkusit znovu nebo obnovit demo data.
- Sekce pro odborníky a administraci se načítají až při otevření (`React.lazy`) a mezitím se zobrazí kostra stránky (obdoba `loading.js`).
- Proč ne SSR nebo Server Components: všechna data prototypu žijí v prohlížeči (localStorage) a stránky jsou záměrně `noindex`, takže vykreslování na serveru by nic nezrychlilo ani nezlepšilo SEO. Pro ostrý provoz s backendem dává smysl přejít na Next.js a veřejné stránky (úvod, seznam a profily psychologů) vykreslovat na serveru.

## Nasazení na GitHub Pages

Repozitář obsahuje dva workflow:

- `.github/workflows/ci.yml` — při každém pushi a pull requestu spustí typecheck, testy a build. Nic nepublikuje.
- `.github/workflows/deploy-pages.yml` — sestaví a nasadí aplikaci na GitHub Pages. **Spouští se jen ručně**, aby nic nebylo publikováno bez výslovného rozhodnutí.

Postup:

1. V repozitáři otevři *Settings → Pages* a jako *Source* zvol **GitHub Actions**.
2. V záložce *Actions* vyber workflow **Nasazení na GitHub Pages** a klikni na **Run workflow**.
3. Pokud chceš nasazovat automaticky po každém pushi do `main`, odkomentuj v workflow blok `push`.

Base cesta: workflow nastaví proměnnou `BASE_PATH` na `/<název-repozitáře>/` (pro repozitář `<účet>.github.io` na `/`). Lokálně se používá relativní `./`. Díky HashRouteru běží všechny stránky z jediného `index.html`, takže GitHub Pages nepotřebují přesměrování 404 a odkazy typu `…/#/psychologove` fungují i po obnovení stránky.

Ruční build pro konkrétní cestu:

```bash
BASE_PATH=/meziapp/ npm run build
```

## Omezení simulace

- Žádná skutečná autentizace ani autorizace. Přepínání rolí je jen nástroj prototypu.
- Bez serveru nelze zaručit transakční ochranu souběžných rezervací **mezi zařízeními**. Ochrana funguje jen v rámci jednoho prohlížeče: tlačítko je během odesílání zablokované, datová vrstva opakované odeslání stejné rezervace nevytvoří dvakrát a před zápisem znovu načte aktuální stav i z ostatních záložek.
- Rezervace, termíny, schvalování a zpětná vazba existují jen v localStorage jednoho prohlížeče.
- Neodesílají se e-maily ani oznámení, nevznikají videohovory a aplikace nepřistupuje k mikrofonu ani kameře.
- Kvalifikace odborníků se neověřuje a nenahrávají se doklady.
- Statistiky v administraci se počítají z demo dat a záměrně neobsahují žádné metriky psychického stavu nebo zlepšení. Zpětná vazba se ptá jen na srozumitelnost průběhu služby a není důkazem účinnosti.
- Krizové kontakty (112, 155, Linka bezpečí 116 111, Linka první psychické pomoci 116 123, Linka pro rodinu a školu 116 000, Rodičovská linka 606 021 021, linka pro oběti trestných činů a domácího násilí 116 006) jsou ověřené podle veřejných zdrojů k datu uvedenému v `src/config/app.ts`. Před spuštěním je musí potvrdit odborný garant.

## Co bude potřeba před skutečným provozem

- Backend s databází, skutečné přihlašování (včetně ověření věku 18+) a autorizace vynucovaná na serveru.
- Transakční rezervace (například unikátní omezení na aktivní rezervaci termínu) a ochrana proti souběhu.
- Právní posouzení zpracování osobních údajů (GDPR), podmínky služby, zásady ochrany soukromí a smlouvy s odborníky.
- Odborný garant, ověřování kvalifikace odborníků a proces vyřizování stížností.
- Potvrzení krizových kontaktů odborným garantem a jasný postup pro akutní situace.
- **Právní posouzení konzultací s nezletilými (15–17 let):** souhlas zákonných zástupců, mlčenlivost a ověření věku.
- Zabezpečené videohovory, e-mailová oznámení (potvrzení, připomenutí, zrušení) a správa souhlasů.
- Testy přístupnosti s uživateli, bezpečnostní audit, monitoring provozu bez sledování uživatelů.

## Jak později nahradit localStorage backendem

Komponenty pracují jen s rozhraními v `src/services/types.ts` (`SessionService`, `ProfileService`, `ApplicationService`, `AvailabilityService`, `AppointmentService`, `AdminService`, `DemoService`). Dnešní implementace je v `src/services/local/` a vytváří se na jediném místě v `src/main.tsx`.

Postup výměny:

1. Vytvoř například `src/services/http/createHttpServices.ts`, která splní stejné rozhraní `AppServices`.
2. **Zápisové metody** (`book`, `cancelAsClient`, `addSlot`, `approve`…) už jsou asynchronní a vracejí `Result`, takže je stačí napojit na API. Pravidla v `src/domain/rules.ts` (překryvy, minulé termíny, limit rezervací) jsou čisté funkce a lze je použít i na serveru.
3. **Čtecí metody** dnes pracují synchronně nad lokálním snapshotem stavu. V backendové verzi jim odpovídá klientská cache (například TanStack Query nebo vlastní store), kterou plní API. Hook `useDemoSnapshot` pak odebírá změny této cache.
4. Demo relaci (`SessionService`) nahradí skutečné přihlášení. Kontroly v `src/services/local/access.ts` se přesunou na server.
5. V `src/main.tsx` vyměň `createLocalServices(...)` za novou implementaci.

## Struktura projektu

```
src/
  config/app.ts            název, texty, pravidla, krizové kontakty
  domain/                  typy entit, čistá pravidla rezervací, validace, práce s časem
  data/seed.ts             fiktivní výchozí data generovaná relativně k dnešku
  storage/                 centrální úložiště, verze schématu, validace
  services/                rozhraní služeb a lokální implementace
  app/AppContext.tsx       poskytovatel služeb a hooky (snapshot, akce s ochranou proti dvojkliku)
  components/              UI komponenty, layout, rezervační a rozvrhové prvky
  pages/                   veřejná část, klient, odborník, administrace
  test/                    pomocníci pro testy
```

## Testy

- `src/services/local/services.test.ts` — rezervace volného termínu, zrušení a opětovné uvolnění, blokace obsazeného, minulého, zrušeného a pozastaveného termínu, dvojité odeslání, překryvy termínů klienta i odborníka, limit rezervací, zpětná vazba, přihlášky a jejich stavy, schválení a zpřístupnění funkcí, pozastavení profilu, filtrování pohledů podle demo účtu, statistiky, zachování dat po obnovení stránky a obnovení dema.
- `src/storage/store.test.ts` — první spuštění, neplatný JSON, jiná verze schématu, nedostupné a zaplněné úložiště, synchronizace mezi záložkami.
- `src/app.flows.test.tsx` — průchody rozhraním: filtrování seznamu, celá rezervace včetně dvojkliku, zrušení, dialog (Escape a návrat focusu), ochrana rolí, schválení žadatele administrací, zkrácené údaje o klientovi, obnovení dema.
