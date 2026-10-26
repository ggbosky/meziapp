import { initials } from '../../domain/text';
import { cn } from './cn';

const TONES = [
  'bg-[#dcebe1] text-[#1b4737]',
  'bg-[#e3ebe0] text-[#33502a]',
  'bg-[#dbe8e8] text-[#1e4b4b]',
  'bg-[#ebe8dc] text-[#544a26]',
  'bg-[#e1e6ec] text-[#2d4459]',
  'bg-[#ece2dc] text-[#5a3b2b]',
];

const SIZES = { sm: 'size-10 text-sm', md: 'size-14 text-lg', lg: 'size-20 text-2xl sm:size-24 sm:text-3xl' } as const;

export function Avatar({ name, tone = 0, size = 'md', className }: { name: string; tone?: number; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold ring-1 ring-black/5',
        TONES[Math.abs(tone) % TONES.length],
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
