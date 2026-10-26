import { ArrowRight, CalendarClock, CalendarOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../domain/time';
import { countLabel } from '../../domain/text';
import type { PublicProfileSummary } from '../../services/types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { LanguageList, SpecializationTags } from './ProfileTags';

export function PsychologistCard({ summary, now }: { summary: PublicProfileSummary; now: Date }) {
  const { profile, nextSlot, openSlotCount } = summary;
  return (
    <article className="group relative flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-soft transition-[box-shadow,border-color] hover:border-brand-300 hover:shadow-raised has-[a:focus-visible]:outline has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand-700 sm:p-6">
      <div className="flex items-start gap-4">
        <Avatar name={profile.professionalName} tone={profile.avatarTone} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-snug text-ink">
            <Link to={`/psychologove/${profile.id}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
              {profile.professionalName}
            </Link>
          </h2>
          <p className="text-sm text-muted">{profile.professionalRole}</p>
        </div>
        {!profile.acceptingBookings && <Badge tone="amber">Nepřijímá rezervace</Badge>}
      </div>
      <div className="mt-4 space-y-3">
        <SpecializationTags ids={profile.specializations} max={3} />
        <LanguageList ids={profile.languages} />
      </div>
      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-4 py-3">
          {nextSlot ? (
            <div className="flex min-w-0 items-start gap-2.5">
              <CalendarClock aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
              <div className="min-w-0">
                <p className="text-xs text-muted">Nejbližší volný termín</p>
                <p className="text-sm font-semibold text-ink first-letter:uppercase">{formatDateTime(nextSlot.startsAt, now)}</p>
                <p className="text-xs text-muted">{countLabel(openSlotCount, 'volný termín', 'volné termíny', 'volných termínů')} celkem</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <CalendarOff aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" />
              <p className="text-sm text-muted">Teď nejsou vypsané volné termíny.</p>
            </div>
          )}
          <ArrowRight aria-hidden className="size-5 shrink-0 text-brand-700 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </article>
  );
}
