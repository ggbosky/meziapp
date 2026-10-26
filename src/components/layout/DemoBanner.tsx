import { FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDemoSnapshot, useServices } from '../../app/AppContext';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { DAY_MS } from '../../domain/time';
import { countLabel } from '../../domain/text';
import { ResetDemoButton } from './ResetDemoButton';

const STALE_AFTER_DAYS = 7;

/** Viditelné označení ukázkového režimu na každé obrazovce + stav ukládání dat. */
export function DemoBanner() {
  const snapshot = useDemoSnapshot();
  const { demo, now } = useServices();
  const ageDays = Math.floor((now().getTime() - Date.parse(snapshot.state.seededAt)) / DAY_MS);
  return (
    <>
      <div className="border-b border-amber-line/70 bg-sun-soft text-amber-ink">
        <p className="container-page py-1.5 text-center text-[0.74rem] leading-snug sm:text-[0.8rem]">
          <FlaskConical aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />
          <strong className="font-bold">Ukázkový režim</strong> · Fiktivní údaje · Nevkládej osobní ani zdravotní informace.{' '}
          <Link to="/o-prototypu" className="font-semibold underline underline-offset-2">
            Více
          </Link>
        </p>
      </div>
      {snapshot.persistence !== 'ok' && (
        <div className="container-page pt-3">
          <Alert tone="warning" title={snapshot.persistence === 'full' ? 'Úložiště prohlížeče je plné' : 'Úložiště prohlížeče není dostupné'}>
            Změny v ukázce fungují, ale po obnovení stránky se neuloží.
            {snapshot.persistence === 'full' ? ' Uvolni místo v prohlížeči nebo obnov demo data.' : ' Prohlížeč pravděpodobně blokuje localStorage (např. v anonymním režimu).'}
          </Alert>
        </div>
      )}
      {ageDays >= STALE_AFTER_DAYS && (
        <div className="container-page pt-3">
          <Alert tone="info" title="Ukázková data jsou starší" action={<ResetDemoButton size="sm" />}>
            Výchozí data vznikla před {countLabel(ageDays, 'dnem', 'dny', 'dny')}, takže část termínů už proběhla. Obnovením demo dat se
            termíny vygenerují znovu od dnešního dne.
          </Alert>
        </div>
      )}
      {snapshot.recoveredFromInvalid && (
        <div className="container-page pt-3">
          <Alert
            tone="info"
            title="Demo data byla obnovena"
            action={
              <Button size="sm" variant="secondary" onClick={() => demo.dismissRecoveryNotice()}>
                Rozumím
              </Button>
            }
          >
            Uložená data v prohlížeči měla neplatný nebo starší formát, proto jsme načetli výchozí ukázková data.
          </Alert>
        </div>
      )}
    </>
  );
}
