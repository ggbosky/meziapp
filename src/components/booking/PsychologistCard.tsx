import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { languageLabel, specializationLabel } from '../../domain/catalog';
import { atTime, formatRelativeDay } from '../../domain/time';
import type { PublicProfileSummary } from '../../services/types';
import { Avatar } from '../ui/Avatar';

/** Karta odborníka v seznamu. Celá karta je odkaz na profil. */
export function PsychologistCard({ summary, now }: { summary: PublicProfileSummary; now: Date }) {
  const { profile, nextSlot } = summary;
  return (
    <article className="relative rounded-[var(--radius-card)] bg-surface p-4 shadow-soft transition-shadow has-[a:focus-visible]:outline has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand-600 hover:shadow-raised sm:p-5">
      <div className="flex gap-4">
        <Avatar name={profile.professionalName} tone={profile.avatarTone} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold leading-snug text-ink">
            <Link to={`/psychologove/${profile.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
              {profile.professionalName}
            </Link>
          </h2>
          <p className="text-sm text-muted">
            {profile.professionalRole} · {profile.languages.map(languageLabel).join(', ')}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-snug text-ink/80">
            <span className="sr-only">Zaměření: </span>
            {profile.specializations.map(specializationLabel).join(' · ')}
          </p>
        </div>
        <ChevronRight aria-hidden className="mt-1 size-5 shrink-0 text-muted" />
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-line pt-3.5 text-sm">
        {!profile.acceptingBookings ? (
          <span className="rounded-full bg-amber-soft px-3 py-1 font-semibold text-amber-ink">Teď nepřijímá nové rezervace</span>
        ) : nextSlot ? (
          <>
            <span className="text-muted">Nejbližší volný termín</span>
            <span className="rounded-full bg-sage-100 px-3 py-1 font-bold text-brand-800 first-letter:uppercase">
              {formatRelativeDay(nextSlot.startsAt, now)} {atTime(nextSlot.startsAt)}
            </span>
          </>
        ) : (
          <span className="text-muted">Teď nejsou vypsané volné termíny.</span>
        )}
      </div>
    </article>
  );
}
