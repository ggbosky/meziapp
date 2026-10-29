import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useAction, useCurrentUser, useServices } from '../../app/AppContext';
import { appConfig } from '../../config/app';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { useToast } from '../ui/Toast';
import { CitySelect } from './CitySelect';

/** Dialog pro zadání polohy. Ukládá se jen nejbližší větší město. */
export function LocationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session } = useServices();
  const user = useCurrentUser();
  const toast = useToast();
  const [value, setValue] = useState<string | null>(() => session.getLocation()?.id ?? null);
  const [save, saving] = useAction(session.setLocation);
  const isClient = user?.role === 'client';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={<MapPin aria-hidden />}
      title="Odkud jsi?"
      description={`Ukážeme ti psychology do ${appConfig.location.nearbyRadiusKm} km, abyste se případně mohli potkat i osobně.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            loading={saving}
            onClick={async () => {
              const result = await save(value);
              if (!result) return;
              if (result.ok) {
                toast(result.value ? `Poloha nastavena: ${result.value.name}.` : 'Poloha je smazaná.');
                onClose();
              }
            }}
          >
            Uložit
          </Button>
        </>
      }
    >
      <div className="space-y-3 pb-1">
        <CitySelect label="Nejbližší větší město" value={value} onChange={setValue} emptyLabel="Nechci uvádět" />
        <p className="text-[0.85rem] leading-relaxed text-muted">
          Nepotřebujeme adresu, stačí město. {isClient ? 'Uloží se k tvému demo účtu' : 'Uloží se jen v tomto prohlížeči'} a kdykoli ho můžeš
          změnit nebo smazat.
        </p>
      </div>
    </Dialog>
  );
}
