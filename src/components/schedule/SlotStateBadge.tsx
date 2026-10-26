import { CalendarCheck, CircleCheck, CircleDashed, CircleX } from 'lucide-react';
import type { OwnSlotView } from '../../services/types';
import { Badge } from '../ui/Badge';

export function slotStateLabel(view: OwnSlotView, now: Date): string {
  switch (view.state) {
    case 'open':
      return 'Volný';
    case 'booked':
      return Date.parse(view.slot.startsAt) <= now.getTime() ? 'Proběhlá konzultace' : 'Rezervovaný';
    case 'withdrawn':
      return 'Zrušený';
    case 'past':
      return 'Proběhl bez rezervace';
  }
}

export function SlotStateBadge({ view, now }: { view: OwnSlotView; now: Date }) {
  const label = slotStateLabel(view, now);
  switch (view.state) {
    case 'open':
      return <Badge tone="outline" icon={<CircleDashed aria-hidden />}>{label}</Badge>;
    case 'booked':
      return Date.parse(view.slot.startsAt) <= now.getTime() ? (
        <Badge tone="neutral" icon={<CircleCheck aria-hidden />}>{label}</Badge>
      ) : (
        <Badge tone="green" icon={<CalendarCheck aria-hidden />}>{label}</Badge>
      );
    case 'withdrawn':
      return <Badge tone="amber" icon={<CircleX aria-hidden />}>{label}</Badge>;
    case 'past':
      return <Badge tone="outline">{label}</Badge>;
  }
}
