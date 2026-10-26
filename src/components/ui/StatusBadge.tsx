import { Ban, CalendarCheck, CircleCheck, CircleDashed, CirclePause, CircleX, Clock, FilePen, FileQuestion } from 'lucide-react';
import { APPLICATION_STATUS_LABELS, APPOINTMENT_STATUS_LABELS } from '../../domain/catalog';
import type { ApplicationStatus, AppointmentStatus, ProfileStatus } from '../../domain/types';
import { Badge } from './Badge';

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const label = APPOINTMENT_STATUS_LABELS[status];
  switch (status) {
    case 'booked':
      return <Badge tone="green" icon={<CalendarCheck aria-hidden />}>{label}</Badge>;
    case 'completed':
      return <Badge tone="neutral" icon={<CircleCheck aria-hidden />}>{label}</Badge>;
    case 'cancelled_by_client':
      return <Badge tone="outline" icon={<CircleX aria-hidden />}>{label}</Badge>;
    case 'cancelled_by_psychologist':
      return <Badge tone="amber" icon={<CircleX aria-hidden />}>{label}</Badge>;
  }
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const label = APPLICATION_STATUS_LABELS[status];
  switch (status) {
    case 'draft':
      return <Badge tone="outline" icon={<FilePen aria-hidden />}>{label}</Badge>;
    case 'submitted':
      return <Badge tone="blue" icon={<Clock aria-hidden />}>{label}</Badge>;
    case 'approved':
      return <Badge tone="green" icon={<CircleCheck aria-hidden />}>{label}</Badge>;
    case 'needs_changes':
      return <Badge tone="amber" icon={<FileQuestion aria-hidden />}>{label}</Badge>;
    case 'rejected':
      return <Badge tone="red" icon={<Ban aria-hidden />}>{label}</Badge>;
  }
}

export function ProfileStatusBadge({ status, acceptingBookings }: { status: ProfileStatus; acceptingBookings: boolean }) {
  if (status === 'suspended') return <Badge tone="red" icon={<CirclePause aria-hidden />}>Pozastavený administrací</Badge>;
  if (!acceptingBookings) return <Badge tone="amber" icon={<CircleDashed aria-hidden />}>Nepřijímá nové rezervace</Badge>;
  return <Badge tone="green" icon={<CircleCheck aria-hidden />}>Aktivní</Badge>;
}
