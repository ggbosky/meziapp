import { cn } from './cn';

/**
 * Vlastní ilustrace aplikace: oblázkové postavičky, kopečky a sluníčko.
 * Jednoduché tvary, aby působily přátelsky a hodily se pro všechny věkové skupiny.
 */

const C = {
  ink: '#16312a',
  green: '#2f7a5a',
  greenLight: '#4a9673',
  hillBack: '#a7d6bd',
  hillFront: '#6fb48f',
  mint: '#cde9d8',
  sun: '#ffd46e',
  peach: '#f6b493',
  sky: '#a6d0ea',
  butter: '#ffe7a3',
  cheek: '#f08f7a',
  white: '#ffffff',
};

interface PebbleProps {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  rotate?: number;
  /** Směr pohledu očí (-1 vlevo, 1 vpravo). */
  look?: number;
  happy?: boolean;
}

/** Oblázková postavička s očima, úsměvem a tvářičkami. */
function Pebble({ x, y, w, h, color, rotate = 0, look = 0, happy = false }: PebbleProps) {
  const rx = w / 2;
  const ry = h / 2;
  // Tvar oblázku: dole širší, nahoře zakulacený.
  const d = `M ${-rx} ${ry * 0.25}
    C ${-rx} ${-ry * 0.75}, ${-rx * 0.55} ${-ry}, 0 ${-ry}
    C ${rx * 0.55} ${-ry}, ${rx} ${-ry * 0.75}, ${rx} ${ry * 0.25}
    C ${rx} ${ry * 0.85}, ${rx * 0.6} ${ry}, 0 ${ry}
    C ${-rx * 0.6} ${ry}, ${-rx} ${ry * 0.85}, ${-rx} ${ry * 0.25} Z`;
  const eyeY = -ry * 0.12;
  const eyeX = rx * 0.32;
  const shift = look * rx * 0.1;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <ellipse cx="0" cy={ry * 0.98} rx={rx * 0.85} ry={ry * 0.1} fill="#000" opacity="0.08" />
      <path d={d} fill={color} />
      <ellipse
        cx={-rx * 0.42}
        cy={-ry * 0.52}
        rx={rx * 0.2}
        ry={ry * 0.11}
        fill="#fff"
        opacity="0.45"
        transform={`rotate(-35 ${-rx * 0.42} ${-ry * 0.52})`}
      />
      {happy ? (
        <>
          <path d={`M ${-eyeX - 4 + shift} ${eyeY + 1} q 4 -5 8 0`} stroke={C.ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d={`M ${eyeX - 4 + shift} ${eyeY + 1} q 4 -5 8 0`} stroke={C.ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={-eyeX + shift} cy={eyeY} r="2.9" fill={C.ink} />
          <circle cx={eyeX + shift} cy={eyeY} r="2.9" fill={C.ink} />
        </>
      )}
      <circle cx={-rx * 0.52 + shift} cy={ry * 0.12} r="4" fill={C.cheek} opacity="0.45" />
      <circle cx={rx * 0.52 + shift} cy={ry * 0.12} r="4" fill={C.cheek} opacity="0.45" />
      <path
        d={`M ${-6 + shift} ${ry * 0.1} q 6 ${happy ? 8 : 5.5} 12 0`}
        stroke={C.ink}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function Leaf({ x, y, rotate, color = C.green, size = 1 }: { x: number; y: number; rotate: number; color?: string; size?: number }) {
  return <ellipse cx={x} cy={y} rx={4.5 * size} ry={10 * size} fill={color} transform={`rotate(${rotate} ${x} ${y})`} />;
}

function Sprout({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 C 0 -10, 1 -20, 0 -30" stroke={C.green} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Leaf x={-7} y={-22} rotate={-50} />
      <Leaf x={7} y={-28} rotate={50} color={C.greenLight} />
      <Leaf x={-5} y={-8} rotate={-60} color={C.greenLight} size={0.8} />
    </g>
  );
}

function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill={C.white}>
      <ellipse cx="0" cy="0" rx="18" ry="11" />
      <ellipse cx="16" cy="3" rx="14" ry="9" />
      <ellipse cx="-15" cy="4" rx="12" ry="8" />
    </g>
  );
}

/** Úvodní scéna: dvě postavičky si povídají na kopečku. */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 340 230" className={cn('h-auto w-full', className)} role="img" aria-label="Ilustrace: dvě postavičky si v klidu povídají na kopečku">
      <circle cx="268" cy="58" r="30" fill={C.sun} />
      <circle cx="268" cy="58" r="42" fill={C.sun} opacity="0.25" />
      <Cloud x={70} y={50} />
      <Cloud x={196} y={30} scale={0.7} />
      <path d="M0 170 C 60 130, 130 128, 190 150 C 240 168, 290 140, 340 128 L 340 230 L 0 230 Z" fill={C.hillBack} />
      <path d="M0 196 C 70 168, 150 166, 230 184 C 280 195, 315 186, 340 180 L 340 230 L 0 230 Z" fill={C.hillFront} />
      <Sprout x={40} y={192} />
      <Sprout x={300} y={188} scale={0.85} />
      <g className="motion-safe:animate-float">
        <rect x="128" y="48" width="66" height="40" rx="17" fill={C.white} />
        <path d="M148 86 l -6 13 l 17 -11 Z" fill={C.white} />
        <circle cx="148" cy="68" r="3.8" fill={C.green} />
        <circle cx="161" cy="68" r="3.8" fill={C.greenLight} />
        <circle cx="174" cy="68" r="3.8" fill={C.hillBack} />
      </g>
      <Pebble x={124} y={150} w={82} h={90} color={C.peach} rotate={6} look={1} />
      <Pebble x={222} y={160} w={68} h={74} color={C.sky} rotate={-7} look={-1} happy />
      <path d="M 246 96 c -3 -6 -12 -4 -10 3 c 1 4 10 9 10 9 c 0 0 9 -5 10 -9 c 2 -7 -7 -9 -10 -3 Z" fill={C.cheek} opacity="0.75" />
    </svg>
  );
}

/** Prázdný stav: postavička s kalendářem. */
export function CalendarIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={cn('h-auto w-full', className)} aria-hidden>
      <ellipse cx="80" cy="108" rx="62" ry="9" fill={C.mint} />
      <g transform="rotate(-6 102 56)">
        <rect x="76" y="22" width="56" height="58" rx="12" fill={C.white} stroke={C.hillBack} strokeWidth="3" />
        <rect x="76" y="22" width="56" height="16" rx="8" fill={C.hillFront} />
        <rect x="76" y="30" width="56" height="8" fill={C.hillFront} />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={85 + c * 14} y={46 + r * 10} width="9" height="6" rx="2" fill={r === 1 && c === 1 ? C.sun : C.mint} />),
        )}
      </g>
      <Pebble x={56} y={80} w={50} h={54} color={C.butter} rotate={4} look={1} />
    </svg>
  );
}

/** Potvrzení: radující se postavička a konfety. */
export function CelebrateIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 140" className={cn('h-auto w-full', className)} aria-hidden>
      <ellipse cx="90" cy="126" rx="66" ry="9" fill={C.mint} />
      {[
        [30, 30, C.sun],
        [150, 24, C.peach],
        [140, 70, C.sky],
        [38, 78, C.hillFront],
        [62, 18, C.sky],
        [120, 14, C.hillFront],
      ].map(([x, y, color], i) => (
        <rect key={i} x={x as number} y={y as number} width="9" height="5" rx="2" fill={color as string} transform={`rotate(${i * 37} ${x} ${y})`} />
      ))}
      <circle cx="128" cy="44" r="16" fill={C.green} />
      <path d="M121 44 l 5 5 l 9 -10" stroke={C.white} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Pebble x={84} y={92} w={68} h={72} color={C.peach} rotate={-3} happy />
    </svg>
  );
}

/** Pro odborníky: postavička s hodinami (nabízený čas). */
export function TimeIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 130" className={cn('h-auto w-full', className)} aria-hidden>
      <ellipse cx="85" cy="118" rx="64" ry="8" fill="#ffffff" opacity="0.18" />
      <circle cx="116" cy="50" r="30" fill={C.white} />
      <circle cx="116" cy="50" r="30" fill="none" stroke={C.sun} strokeWidth="5" />
      <path d="M116 33 V 50 L 128 58" stroke={C.ink} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 70 40 c -3 -6 -12 -4 -10 3 c 1 4 10 9 10 9 c 0 0 9 -5 10 -9 c 2 -7 -7 -9 -10 -3 Z" fill={C.peach} />
      <Pebble x={66} y={88} w={60} h={64} color={C.mint} rotate={-5} look={1} happy />
    </svg>
  );
}
