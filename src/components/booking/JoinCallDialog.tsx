import { useState } from 'react';
import { MapPin, MicOff, Video } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';

/** Tlačítko pro připojení k hovoru. V prototypu pouze vysvětlí, co by se stalo. */
export function JoinCallButton({ size = 'md', variant = 'primary' }: { size?: 'sm' | 'md'; variant?: 'primary' | 'secondary' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={size} variant={variant} icon={<Video aria-hidden className="size-4" />} onClick={() => setOpen(true)}>
        Připojit se ke konzultaci
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        icon={<Video aria-hidden />}
        title="Připojení ke konzultaci (ukázka)"
        description="V prototypu se žádný videohovor nevytváří."
        footer={<Button onClick={() => setOpen(false)}>Rozumím</Button>}
      >
        <div className="space-y-3">
          <p>
            Ve skutečné službě by se tu zhruba 10 minut před začátkem otevřel zabezpečený videohovor s odborníkem. Před vstupem by
            sis mohl(a) vyzkoušet zvuk a obraz.
          </p>
          <p className="flex items-start gap-2 rounded-xl bg-sage-50 p-3 text-brand-900">
            <MicOff aria-hidden className="mt-0.5 size-4 shrink-0" />
            Aplikace nepřistupuje k mikrofonu ani kameře a nezakládá žádnou místnost.
          </p>
        </div>
      </Dialog>
    </>
  );
}

/** Akce u rezervace podle formy: online připojení, nebo informace k osobnímu setkání. */
export function MeetingButton({ format, cityName, size = 'md' }: { format: 'online' | 'in_person'; cityName: string | null; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState(false);
  if (format === 'online') return <JoinCallButton size={size} />;
  return (
    <>
      <Button size={size} icon={<MapPin aria-hidden className="size-4" />} onClick={() => setOpen(true)}>
        Kde se potkáme
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        icon={<MapPin aria-hidden />}
        title={`Osobní setkání${cityName ? ` · ${cityName}` : ''} (ukázka)`}
        description="V prototypu se žádná adresa nesděluje."
        footer={<Button onClick={() => setOpen(false)}>Rozumím</Button>}
      >
        <p>
          Ve skutečné službě by ti odborník po potvrzení rezervace poslal přesnou adresu své praxe a případné pokyny, jak se k ní dostat.
          Aplikace ji zobrazí jen tobě a odborníkovi.
        </p>
      </Dialog>
    </>
  );
}
