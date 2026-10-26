import { Link } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert';
import { formatDate } from '../../domain/time';
import type { PsychologistProfile } from '../../domain/types';

export function ProfileNotices({ profile }: { profile: PsychologistProfile }) {
  return (
    <div className="space-y-3">
      {profile.status === 'suspended' && (
        <Alert tone="error" title="Profil je pozastavený administrací">
          Od {profile.suspendedAt ? formatDate(profile.suspendedAt) : '—'} není profil veřejně vidět a nové termíny nelze přidávat ani rezervovat.
          {profile.suspensionReason ? ` Důvod: ${profile.suspensionReason}` : ''}
        </Alert>
      )}
      {profile.status === 'active' && !profile.acceptingBookings && (
        <Alert tone="warning" title="Příjem nových rezervací je pozastavený">
          Klienti teď nevidí tvé volné termíny. Příjem můžeš znovu zapnout v přehledu nebo v profilu.
        </Alert>
      )}
      {!profile.approach && (
        <Alert tone="info" title="Doplň, jak pracuješ">
          Klientům pomůže krátký popis tvého přístupu. <Link to="/odbornik/profil">Upravit profil</Link>
        </Alert>
      )}
    </div>
  );
}
