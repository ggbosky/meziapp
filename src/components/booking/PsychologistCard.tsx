import { ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { languageLabel, specializationLabel } from '../../domain/catalog';
import { formatDistance } from '../../domain/places';
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
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm font-semibold text-ink/80">
            <MapPin aria-hidden className="size-4 shrink-0 text-brand-700" />
            {summary.city ? summary.city.name : 'Jen online'}
            {summary.distanceKm !== null && <span className="font-medium text-muted">· {formatDistance(summary.distanceKm)}</span>}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Forma a zaměření práce">
            <li className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-semibold text-brand-900">
              {profile.offersInPerson && summary.city ? 'Online i osobně' : 'Online'}
            </li>
            {profile.worksWithYouth && (
              <li className="rounded-full bg-sun-soft px-2.5 py-0.5 text-xs font-semibold text-amber-ink">Pracuje s dospívajícími</li>
            )}
          </ul>
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
