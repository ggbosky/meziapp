import { CirclePause, CirclePlay, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemoSnapshot, useServices } from '../../app/AppContext';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Alert } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProfileStatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { fail } from '../../domain/result';
import { countLabel } from '../../domain/text';
import { formatDate } from '../../domain/time';
import type { PsychologistProfile } from '../../domain/types';
import { ReasonDialog } from './ReasonDialog';

export function ProfilesPage() {
  usePageTitle('Profily odborníků');
  const { admin } = useServices();
  useDemoSnapshot();
  const toast = useToast();
  const items = admin.listProfiles();
  const [suspendTarget, setSuspendTarget] = useState<PsychologistProfile | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<PsychologistProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const active = items.filter((i) => i.profile.status === 'active').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profily odborníků"
        description={`${countLabel(active, 'aktivní profil', 'aktivní profily', 'aktivních profilů')}, ${countLabel(items.length - active, 'pozastavený', 'pozastavené', 'pozastavených')}. Pozastavený profil není veřejně vidět a nelze u něj rezervovat.`}
      />
      {items.length === 0 ? (
        <EmptyState title="Zatím žádné schválené profily" />
      ) : (
        <ul className="space-y-3">
          {items.map(({ profile, upcomingOpenSlots, upcomingBookings }) => (
            <li key={profile.id} className="rounded-[var(--radius-card)] bg-surface p-4 shadow-soft sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={profile.professionalName} tone={profile.avatarTone} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium">{profile.professionalName}</p>
                    <p className="text-sm text-muted">
                      {profile.professionalRole} · schváleno {formatDate(profile.approvedAt)}
                    </p>
                  </div>
                </div>
                <ProfileStatusBadge status={profile.status} acceptingBookings={profile.acceptingBookings} />
              </div>
              <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  Nadcházející: {countLabel(upcomingOpenSlots, 'volný termín', 'volné termíny', 'volných termínů')},{' '}
                  {countLabel(upcomingBookings, 'rezervace', 'rezervace', 'rezervací')}
                  {profile.status === 'suspended' && profile.suspensionReason ? (
                    <span className="mt-1 block text-ink/80">Důvod pozastavení: {profile.suspensionReason}</span>
                  ) : null}
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.status === 'active' ? (
                    <>
                      <Link to={`/psychologove/${profile.id}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-brand-800 hover:bg-sage-100">
                        Veřejný profil <ExternalLink aria-hidden className="size-3.5" />
                      </Link>
                      <Button size="sm" variant="secondary" icon={<CirclePause aria-hidden className="size-4" />} onClick={() => setSuspendTarget(profile)}>
                        Pozastavit
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" icon={<CirclePlay aria-hidden className="size-4" />} onClick={() => setReactivateTarget(profile)}>
                      Obnovit profil
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReasonDialog
        open={suspendTarget !== null}
        onClose={() => setSuspendTarget(null)}
        icon={<CirclePause aria-hidden />}
        variant="danger"
        title={`Pozastavit profil: ${suspendTarget?.professionalName ?? ''}?`}
        description="Profil zmizí z veřejného seznamu a jeho termíny nepůjde rezervovat. Stávající rezervace zůstanou."
        label="Důvod pozastavení (interní)"
        hint="Provozní důvod, např. ověřování údajů. Nepiš sem informace o klientech."
        confirmLabel="Pozastavit profil"
        onSubmit={async (text) => {
          if (!suspendTarget) return fail('NOT_FOUND', 'Profil jsme nenašli.');
          const result = await admin.suspendProfile(suspendTarget.id, text);
          if (result.ok) toast('Profil je pozastavený.');
          return result;
        }}
      />
      <ConfirmDialog
        open={reactivateTarget !== null}
        onCancel={() => {
          setReactivateTarget(null);
          setError(null);
        }}
        icon={<CirclePlay aria-hidden />}
        title={`Obnovit profil: ${reactivateTarget?.professionalName ?? ''}?`}
        description="Profil bude znovu veřejně vidět a jeho budoucí volné termíny půjde rezervovat."
        confirmLabel="Obnovit profil"
        loading={pending}
        onConfirm={async () => {
          if (!reactivateTarget || pending) return;
          setPending(true);
          const result = await admin.reactivateProfile(reactivateTarget.id);
          setPending(false);
          if (result.ok) {
            toast('Profil je znovu aktivní.');
            setReactivateTarget(null);
          } else setError(result.error.message);
        }}
      >
        {error && (
          <Alert tone="error" live>
            {error}
          </Alert>
        )}
      </ConfirmDialog>
    </div>
  );
}
