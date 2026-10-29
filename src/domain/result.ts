export type ErrorCode =
  | 'NOT_SIGNED_IN'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'INVALID_STATE'
  | 'SLOT_IN_PAST'
  | 'SLOT_TAKEN'
  | 'SLOT_WITHDRAWN'
  | 'PROFILE_UNAVAILABLE'
  | 'CLIENT_OVERLAP'
  | 'BOOKING_LIMIT'
  | 'SLOT_OVERLAP'
  | 'NOT_APPROVED'
  | 'NOT_FOR_YOUTH';

export interface DomainError {
  code: ErrorCode;
  /** Srozumitelná česká zpráva pro uživatele. */
  message: string;
  /** Volitelné chyby jednotlivých polí formuláře. */
  fieldErrors?: Record<string, string>;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: DomainError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T = never>(code: ErrorCode, message: string, fieldErrors?: Record<string, string>): Result<T> {
  return { ok: false, error: fieldErrors ? { code, message, fieldErrors } : { code, message } };
}

export function domainError(code: ErrorCode, message: string): DomainError {
  return { code, message };
}
