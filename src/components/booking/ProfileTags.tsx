import { Languages } from 'lucide-react';
import { languageLabel, specializationLabel } from '../../domain/catalog';
import type { LanguageCode, SpecializationId } from '../../domain/types';

export function SpecializationTags({ ids, max }: { ids: SpecializationId[]; max?: number }) {
  const shown = max ? ids.slice(0, max) : ids;
  const rest = ids.length - shown.length;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Zaměření">
      {shown.map((id) => (
        <li key={id} className="rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-brand-900">
          {specializationLabel(id)}
        </li>
      ))}
      {rest > 0 && (
        <li className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
          +{rest}
          <span className="sr-only"> další</span>
        </li>
      )}
    </ul>
  );
}

export function LanguageList({ ids }: { ids: LanguageCode[] }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted">
      <Languages aria-hidden className="size-4 shrink-0 text-brand-700" />
      <span className="sr-only">Jazyky: </span>
      {ids.map(languageLabel).join(', ')}
    </p>
  );
}
