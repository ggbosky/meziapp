import { MapPin, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useDemoSnapshot, useServices } from '../../app/AppContext';
import { appConfig } from '../../config/app';
import { cn } from '../ui/cn';
import { LocationDialog } from './LocationDialog';

/** Pruh s aktuální polohou a tlačítkem pro změnu. */
export function LocationBar({ className }: { className?: string }) {
  const { session } = useServices();
  useDemoSnapshot();
  const [open, setOpen] = useState(false);
  const city = session.getLocation();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left transition-colors',
          city ? 'bg-sky-soft hover:bg-sky-soft/70' : 'bg-surface shadow-soft hover:bg-sage-50',
          className,
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-800 shadow-soft">
          <MapPin aria-hidden className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          {city ? (
            <>
              <span className="block text-xs font-semibold text-muted">Tvoje okolí</span>
              <span className="block truncate font-bold text-ink">
                {city.name} <span className="font-medium text-muted">· do {appConfig.location.nearbyRadiusKm} km</span>
              </span>
            </>
          ) : (
            <>
              <span className="block font-bold text-ink">Odkud jsi?</span>
              <span className="block text-sm text-muted">Ukážeme ti psychology ve tvém okolí</span>
            </>
          )}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700">
          <Pencil aria-hidden className="size-4" />
          {city ? 'Změnit' : 'Vybrat'}
        </span>
      </button>
      {open && <LocationDialog open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
