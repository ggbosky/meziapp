import { Link } from 'react-router-dom';
import { appConfig } from '../../config/app';
import { Logo } from '../ui/Logo';
import { ResetDemoButton } from './ResetDemoButton';

export function Footer() {
  const link = 'inline-flex min-h-9 items-center text-sm text-muted hover:text-brand-900 hover:underline underline-offset-4';
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Nezisková služba pro dospělé, kteří hledají bezplatnou konzultaci s psychologem. Bez poplatků, reklam a placeného předbíhání.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Nejde o krizovou pomoc. <Link to="/nalehava-pomoc" className="link">Co dělat v naléhavé situaci</Link>
          </p>
        </div>
        <nav aria-label="Služba">
          <h2 className="text-sm font-semibold text-ink">Služba</h2>
          <ul className="mt-3 space-y-1">
            <li><Link to="/psychologove" className={link}>Psychologové</Link></li>
            <li><Link to="/pro-odborniky" className={link}>Pro odborníky</Link></li>
            <li><Link to="/nalehava-pomoc" className={link}>Naléhavá pomoc</Link></li>
            <li><Link to="/#faq" className={link}>Časté otázky</Link></li>
          </ul>
        </nav>
        <nav aria-label="Prototyp">
          <h2 className="text-sm font-semibold text-ink">Prototyp</h2>
          <ul className="mt-3 space-y-1">
            <li><Link to="/o-prototypu" className={link}>O prototypu a omezeních</Link></li>
            <li><Link to="/vyzkouset" className={link}>Vyzkoušet demo účty</Link></li>
          </ul>
          <ResetDemoButton size="sm" className="mt-4" />
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs leading-relaxed text-muted sm:flex-row sm:justify-between">
          <p>Demonstrační prototyp. Všechny osoby, kvalifikace, termíny, rezervace i výsledky schvalování jsou fiktivní.</p>
          <p>Kontakt (fiktivní): {appConfig.contactEmail}</p>
        </div>
      </div>
    </footer>
  );
}
