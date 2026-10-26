import { Link } from 'react-router-dom';
import { appConfig } from '../../config/app';

/** Patička na počítači. Na telefonu jsou stejné odkazy v kartě Účet. */
export function Footer() {
  return (
    <footer className="hidden border-t border-line lg:block">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-6 text-sm text-muted">
        <p>Demonstrační prototyp. Všechny osoby, termíny a rezervace jsou fiktivní.</p>
        <nav aria-label="Odkazy v patičce" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link to="/o-prototypu" className="hover:text-ink hover:underline">O prototypu</Link>
          <Link to="/nalehava-pomoc" className="hover:text-ink hover:underline">Naléhavá pomoc</Link>
          <Link to="/#faq" className="hover:text-ink hover:underline">Časté otázky</Link>
          <span>{appConfig.contactEmail} (fiktivní)</span>
        </nav>
      </div>
    </footer>
  );
}
