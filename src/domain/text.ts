/** České skloňování podle počtu: 1 termín, 2 termíny, 5 termínů. */
export function plural(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count);
  if (abs === 1) return one;
  if (abs >= 2 && abs <= 4) return few;
  return many;
}

export function countLabel(count: number, one: string, few: string, many: string): string {
  return `${count} ${plural(count, one, few, many)}`;
}

/** Iniciály pro avatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** „Tereza Malá“ → „Tereza M.“ — minimum údajů o klientovi pro odborníka. */
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts[0]} ${parts[parts.length - 1]?.[0] ?? ''}.`;
}

export function percent(value: number): string {
  return `${Math.round(value * 100)} %`;
}
