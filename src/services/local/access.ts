import { fail, ok, type Result } from '../../domain/result';
import type { DemoState } from '../../domain/state';
import type { PsychologistApplication, PsychologistProfile, User, UserRole } from '../../domain/types';

/**
 * Simulovaná oprávnění. Vycházejí z demo relace v úložišti a chovají se
 * jako kontroly na serveru, ale data nijak nechrání.
 */

export function currentUser(state: DemoState): User | null {
  const id = state.session.userId;
  return id ? (state.users.find((u) => u.id === id) ?? null) : null;
}

export function requireRole(state: DemoState, role: UserRole): Result<User> {
  const user = currentUser(state);
  if (!user) return fail('NOT_SIGNED_IN', 'Pro tuto akci je potřeba vstoupit do demo účtu.');
  if (user.role !== role) return fail('FORBIDDEN', 'Tahle akce není pro aktuální demo účet dostupná.');
  return ok(user);
}

export interface ApprovedProfessional {
  user: User;
  application: PsychologistApplication;
  profile: PsychologistProfile;
}

/** Funkce psychologa jsou dostupné jen se schválenou přihláškou a profilem. */
export function requireApprovedProfessional(state: DemoState): Result<ApprovedProfessional> {
  const userResult = requireRole(state, 'professional');
  if (!userResult.ok) return userResult;
  const user = userResult.value;
  const application = state.applications.find((a) => a.userId === user.id);
  const profile = state.profiles.find((p) => p.userId === user.id);
  if (!application || application.status !== 'approved' || !profile) {
    return fail('NOT_APPROVED', 'Tato část je dostupná až po schválení přihlášky.');
  }
  return ok({ user, application, profile });
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}
