import { appConfig } from '../config/app';
import type { ISODateTime } from './types';

/**
 * Práce s časem. Data se ukládají v UTC, zobrazují a zadávají se
 * v časovém pásmu služby (Europe/Prague) bez ohledu na pásmo prohlížeče.
 */

export const MINUTE_MS = 60_000;
export const DAY_MS = 24 * 60 * MINUTE_MS;
const TZ = appConfig.timeZone;
const LOCALE = appConfig.locale;

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = pondělí … 6 = neděle */
  weekday: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(options);
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, f);
  }
  return f;
}

const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export function getZonedParts(instant: Date, timeZone: string = TZ): ZonedParts {
  const parts = formatter('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '0';
  const hour = Number(get('hour'));
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: hour === 24 ? 0 : hour,
    minute: Number(get('minute')),
    weekday: WEEKDAY_INDEX[get('weekday')] ?? 0,
  };
}

/** Posun časového pásma oproti UTC v minutách (např. 60 nebo 120 pro Prahu). */
export function zoneOffsetMinutes(instant: Date, timeZone: string = TZ): number {
  const p = getZonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const truncated = Math.floor(instant.getTime() / MINUTE_MS) * MINUTE_MS;
  return Math.round((asUtc - truncated) / MINUTE_MS);
}

/** Převede místní čas v pásmu služby na okamžik v UTC. */
export function zonedTimeToUtc(
  local: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string = TZ,
): Date {
  const guess = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const firstOffset = zoneOffsetMinutes(new Date(guess), timeZone);
  let result = guess - firstOffset * MINUTE_MS;
  const secondOffset = zoneOffsetMinutes(new Date(result), timeZone);
  if (secondOffset !== firstOffset) result = guess - secondOffset * MINUTE_MS;
  return new Date(result);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE_MS);
}

export function toISO(date: Date): ISODateTime {
  return date.toISOString();
}

export function isValidISO(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value));
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Kalendářní den v pásmu služby ve tvaru YYYY-MM-DD. */
export function dateKey(instant: Date | ISODateTime): string {
  const p = getZonedParts(typeof instant === 'string' ? new Date(instant) : instant);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [y, m, d] = key.split('-').map(Number);
  return { year: y ?? 1970, month: m ?? 1, day: d ?? 1 };
}

export function addDaysToKey(key: string, days: number): string {
  const { year, month, day } = parseDateKey(key);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Pondělí týdne, do kterého patří daný den (YYYY-MM-DD). */
export function weekStartKey(key: string): string {
  const { year, month, day } = parseDateKey(key);
  const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  return addDaysToKey(key, -weekday);
}

/** Okamžik začátku daného kalendářního dne v pásmu služby. */
export function startOfDayKey(key: string): Date {
  return zonedTimeToUtc({ ...parseDateKey(key), hour: 0, minute: 0 });
}

/** Místní čas v pásmu služby (datum + HH:MM) na UTC ISO řetězec. */
export function localInputToISO(dateValue: string, timeValue: string): ISODateTime | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) return null;
  const [hour, minute] = timeValue.split(':').map(Number);
  if (hour === undefined || minute === undefined || hour > 23 || minute > 59) return null;
  const date = zonedTimeToUtc({ ...parseDateKey(dateValue), hour, minute });
  return Number.isNaN(date.getTime()) ? null : toISO(date);
}

// ——— Formátování pro zobrazení ———

const asDate = (value: Date | ISODateTime): Date => (typeof value === 'string' ? new Date(value) : value);

/** „9:00“ */
export function formatTime(value: Date | ISODateTime): string {
  return formatter(LOCALE, { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(asDate(value));
}

/** „pondělí 27. října“ */
export function formatDayLong(value: Date | ISODateTime): string {
  return formatter(LOCALE, { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(asDate(value));
}

/** „po 27. 10.“ */
export function formatDayShort(value: Date | ISODateTime): string {
  const d = asDate(value);
  const weekday = formatter(LOCALE, { timeZone: TZ, weekday: 'short' }).format(d);
  const date = formatter(LOCALE, { timeZone: TZ, day: 'numeric', month: 'numeric' }).format(d);
  return `${weekday} ${date}`;
}

/** „27. 10. 2026“ */
export function formatDate(value: Date | ISODateTime): string {
  return formatter(LOCALE, { timeZone: TZ, day: 'numeric', month: 'numeric', year: 'numeric' }).format(asDate(value));
}

/** „27. 10. 2026 9:05“ */
export function formatTimestamp(value: Date | ISODateTime): string {
  return `${formatDate(value)} ${formatTime(value)}`;
}

/** Předložka „v“/„ve“ před časem: „ve 14:00“, ale „v 9:00“. */
export function atTime(value: Date | ISODateTime): string {
  const hour = getZonedParts(asDate(value)).hour;
  return `${hour === 4 || hour === 14 ? 've' : 'v'} ${formatTime(value)}`;
}

/** „dnes“, „zítra“ nebo „pondělí 27. října“ */
export function formatRelativeDay(value: Date | ISODateTime, now: Date): string {
  const key = dateKey(asDate(value));
  const today = dateKey(now);
  if (key === today) return 'dnes';
  if (key === addDaysToKey(today, 1)) return 'zítra';
  return formatDayLong(value);
}

/** „zítra v 9:00“ / „pondělí 27. října ve 14:00“ */
export function formatDateTime(value: Date | ISODateTime, now?: Date): string {
  const day = now ? formatRelativeDay(value, now) : formatDayLong(value);
  return `${day} ${atTime(value)}`;
}

/** „9:00–9:50“ */
export function formatTimeRange(start: ISODateTime, durationMinutes: number): string {
  return `${formatTime(start)}–${formatTime(addMinutes(new Date(start), durationMinutes))}`;
}

export function formatDayKeyLong(key: string): string {
  return formatDayLong(zonedTimeToUtc({ ...parseDateKey(key), hour: 12, minute: 0 }));
}

export function formatDayKeyShort(key: string): string {
  return formatDayShort(zonedTimeToUtc({ ...parseDateKey(key), hour: 12, minute: 0 }));
}
