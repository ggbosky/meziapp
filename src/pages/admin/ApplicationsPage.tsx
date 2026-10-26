import { ChevronRight, Inbox } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemoSnapshot, useServices } from '../../app/AppContext';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { cn } from '../../components/ui/cn';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { ApplicationStatusBadge } from '../../components/ui/StatusBadge';
import { APPLICATION_STATUS_LABELS } from '../../domain/catalog';
import { formatDate } from '../../domain/time';
import type { ApplicationStatus } from '../../domain/types';

const FILTERS: Array<ApplicationStatus | 'all'> = ['submitted', 'needs_changes', 'approved', 'rejected', 'draft', 'all'];

export function ApplicationsPage() {
  usePageTitle('Žádosti odborníků');
  const { admin } = useServices();
  useDemoSnapshot();
  const all = admin.listApplications();
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('submitted');
  const items = filter === 'all' ? all : all.filter((a) => a.status === filter);
  const count = (f: ApplicationStatus | 'all') => (f === 'all' ? all.length : all.filter((a) => a.status === f).length);

  return (
    <div className="space-y-6">
      <PageHeader title="Žádosti odborníků" description="Každou přihlášku posuzuje člověk. V prototypu se neověřují žádné doklady." />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtr podle stavu">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'min-h-10 rounded-full border px-3.5 text-sm font-medium transition-colors',
              filter === f ? 'border-brand-800 bg-brand-800 text-white' : 'border-line-strong bg-surface text-ink hover:border-brand-600',
            )}
          >
            {f === 'all' ? 'Všechny' : APPLICATION_STATUS_LABELS[f]} ({count(f)})
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Inbox aria-hidden />} title="V tomto stavu teď nejsou žádné přihlášky" />
      ) : (
        <ul className="space-y-2.5">
          {items.map((app) => (
            <li key={app.id}>
              <Link to={`/admin/zadosti/${app.id}`} className="flex items-center gap-4 rounded-[20px] bg-surface p-4 shadow-soft hover:shadow-raised">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{app.professionalName || 'Bez jména'}</p>
                  <p className="text-sm text-muted">
                    {app.professionalRole || '—'} · {app.submittedAt ? `odesláno ${formatDate(app.submittedAt)}` : `upraveno ${formatDate(app.updatedAt)}`}
                  </p>
                </div>
                <ApplicationStatusBadge status={app.status} />
                <ChevronRight aria-hidden className="size-5 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
