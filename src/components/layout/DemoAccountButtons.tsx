import { useNavigate } from 'react-router-dom';
import { useServices } from '../../app/AppContext';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

/** Rychlý vstup do konkrétních demo účtů (nástroj prototypu, ne přihlášení). */
export function DemoAccountButtons({ userIds, redirectTo }: { userIds: string[]; redirectTo?: string }) {
  const { session } = useServices();
  const navigate = useNavigate();
  const toast = useToast();
  const users = session.listDemoAccounts().filter((u) => userIds.includes(u.id));
  return (
    <div className="flex flex-wrap gap-2">
      {users.map((user, index) => (
        <Button
          key={user.id}
          variant={index === 0 ? 'primary' : 'secondary'}
          onClick={async () => {
            const result = await session.signInAs(user.id);
            if (result.ok) {
              toast(`Jsi v demo účtu: ${user.displayName}.`, 'info');
              if (redirectTo) navigate(redirectTo);
            }
          }}
        >
          Vstoupit jako {user.displayName}
        </Button>
      ))}
    </div>
  );
}
