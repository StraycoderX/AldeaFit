/**
 * Local persistence.
 *
 * Everything the user enters stays in `localStorage` on their own device — no
 * account, no server, no analytics. That makes the threat model small but not
 * empty: `localStorage` is shared with anything else running on the origin, and
 * the JSON import path accepts a file the user could have received from anyone.
 *
 * So every read is treated as untrusted:
 *  - `JSON.parse` is always wrapped; a corrupted key must not white-screen the app.
 *  - Parsed data is structurally validated field by field, never cast with `as`.
 *  - Records are bounded in count and string length so a hand-edited file cannot
 *    exhaust memory or smuggle a huge payload into the UI.
 */

import { LIMITS } from './validation';
import type { Unit } from './units';
import type { LiftId, Sex } from './standards';

const STORAGE_PREFIX = 'aldeafit:';
export const SCHEMA_VERSION = 1;

/** Cap on stored history. Old entries are dropped first once this is hit. */
export const MAX_HISTORY_ENTRIES = 500;

/** Cap on any user-supplied string, to bound what a crafted import can inject. */
const MAX_STRING_LENGTH = 120;

export interface HistoryEntry {
  id: string;
  /** Epoch milliseconds. */
  date: number;
  lift: LiftId;
  /** Free-text label, only used when `lift` is 'other'. */
  label: string;
  weightKg: number;
  reps: number;
  rir: number;
  oneRmKg: number;
}

export interface Settings {
  unit: Unit;
  theme: 'dark' | 'light' | 'system';
  locale: 'es' | 'en';
  sex: Sex;
  bodyweightKg: number;
  barKg: number;
}

export const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  theme: 'dark',
  locale: 'es',
  sex: 'male',
  bodyweightKg: 75,
  barKg: 20,
};

/* ------------------------------------------------------------------ */
/* Low-level safe access                                               */
/* ------------------------------------------------------------------ */

/**
 * `localStorage` throws rather than returning null in several real situations:
 * Safari private browsing, disabled site data, and an exhausted quota. Every
 * access is guarded so the app degrades to in-memory state instead of crashing.
 */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    /* Nothing useful to do — the value simply stays. */
  }
}

function parseJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Validators                                                          */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function boundedNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (value < min || value > max) return fallback;
  return value;
}

/** Accept a string only if it is short enough; otherwise truncate it. */
function boundedString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, MAX_STRING_LENGTH);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

const VALID_LIFTS: readonly LiftId[] = ['squat', 'bench', 'deadlift', 'ohp', 'row', 'other'];

/**
 * Validate one history entry. Returns null when the shape is unusable, so a
 * single bad record in an imported file is discarded rather than poisoning the
 * whole list.
 */
function validateEntry(value: unknown): HistoryEntry | null {
  if (!isRecord(value)) return null;

  const weightKg = boundedNumber(value.weightKg, LIMITS.weightKg.min, LIMITS.weightKg.max, 0);
  const reps = boundedNumber(value.reps, LIMITS.reps.min, LIMITS.reps.max, 0);
  const oneRmKg = boundedNumber(value.oneRmKg, LIMITS.weightKg.min, LIMITS.weightKg.max * 2, 0);

  // These three carry the meaning of the record; without them it is noise.
  if (weightKg === 0 || reps === 0 || oneRmKg === 0) return null;

  const date = boundedNumber(value.date, 0, Date.now() + 86_400_000, Date.now());

  return {
    // Regenerate the id rather than trusting one from a file; it is only ever
    // used as a React key and a delete handle.
    id: typeof value.id === 'string' && /^[a-zA-Z0-9_-]{1,40}$/.test(value.id)
      ? value.id
      : createId(),
    date,
    lift: oneOf(value.lift, VALID_LIFTS, 'other'),
    label: boundedString(value.label),
    weightKg,
    reps: Math.round(reps),
    rir: Math.round(boundedNumber(value.rir, LIMITS.rir.min, LIMITS.rir.max, 0)),
    oneRmKg,
  };
}

function validateSettings(value: unknown): Settings {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS };

  return {
    unit: oneOf(value.unit, ['kg', 'lb'] as const, DEFAULT_SETTINGS.unit),
    theme: oneOf(value.theme, ['dark', 'light', 'system'] as const, DEFAULT_SETTINGS.theme),
    locale: oneOf(value.locale, ['es', 'en'] as const, DEFAULT_SETTINGS.locale),
    sex: oneOf(value.sex, ['male', 'female'] as const, DEFAULT_SETTINGS.sex),
    bodyweightKg: boundedNumber(
      value.bodyweightKg,
      LIMITS.bodyweightKg.min,
      LIMITS.bodyweightKg.max,
      DEFAULT_SETTINGS.bodyweightKg,
    ),
    barKg: boundedNumber(value.barKg, LIMITS.barKg.min, LIMITS.barKg.max, DEFAULT_SETTINGS.barKg),
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Collision-resistant id that works without `crypto.randomUUID` on old Safari. */
export function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    }
  } catch {
    /* Fall through to the Math.random path. */
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function loadSettings(): Settings {
  return validateSettings(parseJson(safeGet('settings')));
}

export function saveSettings(settings: Settings): boolean {
  return safeSet('settings', JSON.stringify(settings));
}

export function loadHistory(): HistoryEntry[] {
  const parsed = parseJson(safeGet('history'));
  if (!Array.isArray(parsed)) return [];

  return parsed
    .slice(0, MAX_HISTORY_ENTRIES)
    .map(validateEntry)
    .filter((entry): entry is HistoryEntry => entry !== null)
    .sort((a, b) => b.date - a.date);
}

export function saveHistory(entries: HistoryEntry[]): boolean {
  // Newest first, hard-capped so the key can never grow without bound.
  const trimmed = [...entries].sort((a, b) => b.date - a.date).slice(0, MAX_HISTORY_ENTRIES);
  return safeSet('history', JSON.stringify(trimmed));
}

export function clearAll(): void {
  safeRemove('settings');
  safeRemove('history');
}

export interface ExportBundle {
  app: 'aldeafit';
  version: number;
  exportedAt: string;
  settings: Settings;
  history: HistoryEntry[];
}

export function exportData(settings: Settings, history: HistoryEntry[]): ExportBundle {
  return {
    app: 'aldeafit',
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    history,
  };
}

export interface ImportResult {
  ok: boolean;
  settings?: Settings;
  history?: HistoryEntry[];
  /** Number of records rejected by validation. */
  skipped: number;
  error?: 'invalid-json' | 'wrong-format' | 'too-large';
}

/** Largest import accepted, in bytes. Comfortably above a full 500-entry export. */
export const MAX_IMPORT_BYTES = 512 * 1024;

/**
 * Parse a user-supplied backup file.
 *
 * The input is fully untrusted: it arrives from the filesystem and may have been
 * edited or shared. Size is checked before parsing, the envelope is checked
 * before the contents, and every record goes through the same validator used on
 * normal reads.
 */
export function importData(raw: string): ImportResult {
  if (raw.length > MAX_IMPORT_BYTES) return { ok: false, skipped: 0, error: 'too-large' };

  const parsed = parseJson(raw);
  if (parsed === null) return { ok: false, skipped: 0, error: 'invalid-json' };
  if (!isRecord(parsed) || parsed.app !== 'aldeafit') {
    return { ok: false, skipped: 0, error: 'wrong-format' };
  }

  const rawHistory = Array.isArray(parsed.history) ? parsed.history : [];
  const capped = rawHistory.slice(0, MAX_HISTORY_ENTRIES);

  const history = capped
    .map(validateEntry)
    .filter((entry): entry is HistoryEntry => entry !== null);

  return {
    ok: true,
    settings: validateSettings(parsed.settings),
    history: history.sort((a, b) => b.date - a.date),
    skipped: rawHistory.length - history.length,
  };
}
