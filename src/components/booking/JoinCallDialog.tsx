import { useState } from 'react';
import { MicOff, Video } from 'lucide-react';
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
