import { CalendarRange } from 'lucide-react';
import { useState } from 'react';
import { useDemoSnapshot, useServices } from '../../app/AppContext';
import { AppointmentRow } from '../../components/booking/AppointmentRow';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { EmptyState } from '../../components/ui/EmptyState';
import { SelectField } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { APPOINTMENT_STATUS_LABELS } from '../../domain/catalog';
import { countLabel } from '../../domain/text';
import type { AppointmentStatus } from '../../domain/types';

export function AppointmentsAdminPage() {
  usePageTitle('Rezervace');
  const { admin } = useServices();
  useDemoSnapshot();
  const all = admin.listAppointments();
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const items = status ? all.filter((v) => v.status === status) : all;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rezervace"
        description="Provozní přehled bez jakýchkoli informací o důvodu konzultace nebo zdravotním stavu klientů."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-72">
          <SelectField
            label="Stav"
            value={status}
            onChange={(e) => setStatus(e.target.value as AppointmentStatus | '')}
            options={[{ value: '', label: 'Všechny stavy' }, ...Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))]}
          />
        </div>
        <p className="text-sm text-muted" role="status">
          {countLabel(items.length, 'rezervace', 'rezervace', 'rezervací')}
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<CalendarRange aria-hidden />} title="V tomto stavu nejsou žádné rezervace" />
      ) : (
        <ul className="space-y-2.5">
          {items.map((v) => (
            <li key={v.appointment.id}>
              <AppointmentRow
                startsAt={v.appointment.startsAt}
                durationMinutes={v.appointment.durationMinutes}
                title={v.profileName}
                subtitle={`klient ${v.clientLabel}`}
                status={v.status}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
