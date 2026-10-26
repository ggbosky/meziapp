import { initials } from '../../domain/text';
import { cn } from './cn';

const TONES = [
  'bg-[#cde9d8] text-[#174a36]',
  'bg-[#ffe7a3] text-[#5c4300]',
  'bg-[#fbd3bf] text-[#6b2f17]',
  'bg-[#cfe5f3] text-[#1f4763]',
  'bg-[#e1ecc8] text-[#3c4f17]',
  'bg-[#f3e0cf] text-[#5a3b22]',
];

const SIZES = { sm: 'size-11 text-sm', md: 'size-16 text-xl', lg: 'size-24 text-3xl sm:size-28 sm:text-4xl' } as const;

export function Avatar({ name, tone = 0, size = 'md', className }: { name: string; tone?: number; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[38%] font-round font-extrabold',
        TONES[Math.abs(tone) % TONES.length],
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
