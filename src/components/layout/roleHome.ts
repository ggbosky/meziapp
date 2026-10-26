import type { User, UserRole } from '../../domain/types';

export const ROLE_HOME: Record<UserRole, string> = {
  client: '/klient',
  professional: '/odbornik',
  admin: '/admin',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  client: 'Klient',
  professional: 'Odborník',
  admin: 'Administrace',
};

export function homeFor(user: User | null): string {
  return user ? ROLE_HOME[user.role] : '/vyzkouset';
}
