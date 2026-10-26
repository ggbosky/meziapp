import { useDemoSnapshot, useServices } from '../../app/AppContext';
import { usePageTitle } from '../../components/layout/usePageTitle';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { AuditList } from './AuditList';

export function AuditPage() {
  usePageTitle('Historie změn');
  const { admin } = useServices();
  useDemoSnapshot();
  return (
    <div className="space-y-6">
      <PageHeader title="Historie administrativních změn" description="Schvalování, žádosti o doplnění, zamítnutí, poznámky a pozastavení profilů. Nejnovější nahoře." />
      <Card>
        <AuditList events={admin.listAuditEvents()} actorName={admin.getUserName} />
      </Card>
    </div>
  );
}
