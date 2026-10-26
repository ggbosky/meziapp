import { ExternalLink, Save } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAction, useDemoSnapshot, useServices } from '../../app/AppContext';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Alert } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ChipCheckboxGroup, TextArea } from '../../components/ui/Field';
import { PageHeader, SectionTitle } from '../../components/ui/PageHeader';
import { ProfileStatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { LANGUAGES, SPECIALIZATIONS } from '../../domain/catalog';
import { countLabel } from '../../domain/text';
import type { PsychologistProfile } from '../../domain/types';
import { PROFILE_LIMITS, type ProfileEditInput } from '../../domain/validation';
import { AcceptingToggle } from './AcceptingToggle';
import { ApprovedOnly } from './ProfessionalLayout';
import { ProfileNotices } from './ProfileNotices';

export function ProfilePage() {
  return (
    <ApprovedOnly>
      <ProfileEditor />
    </ApprovedOnly>
  );
}

function ProfileEditor() {
  usePageTitle('Můj profil');
  const { profiles } = useServices();
  useDemoSnapshot();
  const status = profiles.getOwnStatus();
  if (status?.kind !== 'approved') return null;
  return <ProfileForm profile={status.profile} key={status.profile.id} />;
}

function ProfileForm({ profile }: { profile: PsychologistProfile }) {
  const { profiles } = useServices();
  const toast = useToast();
  const [form, setForm] = useState<ProfileEditInput>({
    approach: profile.approach,
    bio: profile.bio,
    specializations: profile.specializations,
    languages: profile.languages,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [save, saving] = useAction(profiles.updateOwnProfile);
  const set = <K extends keyof ProfileEditInput>(key: K, value: ProfileEditInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Můj profil"
        description="Takhle tě uvidí klienti. Jméno, roli a kvalifikaci mění administrace na základě přihlášky."
        actions={
          profile.status === 'active' ? (
            <Link to={`/psychologove/${profile.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-800 hover:underline">
              Zobrazit veřejný profil <ExternalLink aria-hidden className="size-4" />
            </Link>
          ) : undefined
        }
      />
      <ProfileNotices profile={profile} />

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar name={profile.professionalName} tone={profile.avatarTone} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{profile.professionalName}</p>
          <p className="text-sm text-muted">{profile.professionalRole}</p>
        </div>
        <ProfileStatusBadge status={profile.status} acceptingBookings={profile.acceptingBookings} />
      </Card>

      <Card as="section" aria-labelledby="edit-title">
        <SectionTitle id="edit-title">Popis pro klienty</SectionTitle>
        <form
          noValidate
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await save(form);
            if (!result) return;
            if (result.ok) {
              setErrors({});
              toast('Profil je uložený.');
            } else setErrors(result.error.fieldErrors ?? { form: result.error.message });
          }}
        >
          <TextArea
            label="Jak pracuji"
            hint="Popiš, jak konzultace s tebou probíhá. Neslibuj výsledky ani uzdravení."
            value={form.approach}
            onChange={(e) => set('approach', e.target.value)}
            maxChars={PROFILE_LIMITS.approach.max}
            error={errors.approach}
            rows={5}
            required
          />
          <TextArea label="O mně" value={form.bio} onChange={(e) => set('bio', e.target.value)} maxChars={PROFILE_LIMITS.bio.max} error={errors.bio} rows={3} />
          <ChipCheckboxGroup
            legend="Zaměření"
            name="specializations"
            options={SPECIALIZATIONS.map((s) => ({ value: s.id, label: s.label }))}
            value={form.specializations}
            onChange={(v) => set('specializations', v)}
            error={errors.specializations}
            required
          />
          <ChipCheckboxGroup
            legend="Jazyky konzultací"
            name="languages"
            options={LANGUAGES.map((l) => ({ value: l.id, label: l.label }))}
            value={form.languages}
            onChange={(v) => set('languages', v)}
            error={errors.languages}
            required
          />
          {Object.keys(errors).length > 0 && (
            <Alert tone="error" live>
              {errors.form ?? 'Zkontroluj prosím zvýrazněná pole.'}
            </Alert>
          )}
          <Button type="submit" loading={saving} icon={<Save aria-hidden className="size-4" />}>
            Uložit profil
          </Button>
        </form>
      </Card>

      <Card as="section" aria-labelledby="qual-title">
        <SectionTitle id="qual-title">Kvalifikace (z přihlášky)</SectionTitle>
        <p className="leading-relaxed text-ink/90">{profile.qualificationSummary}</p>
        <p className="mt-3 text-sm text-muted">Nabízená kapacita: {countLabel(profile.capacityPerMonth, 'konzultace', 'konzultace', 'konzultací')} měsíčně.</p>
      </Card>

      <Card as="section" aria-label="Příjem rezervací">
        <AcceptingToggle profile={profile} />
      </Card>
    </div>
  );
}
