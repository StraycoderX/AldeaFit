/**
 * Input validation.
 *
 * Every number that reaches the calculators passes through here first. The
 * reference implementation this app improves on ran `parseFloat` straight into
 * the formula, so `NaN`, negative loads and 500-rep sets all produced
 * confident-looking garbage. Validation is centralised so the UI, the URL
 * deep-link parser and the JSON importer all enforce the same bounds.
 */

import type { Unit } from './units';

/** Hard bounds, expressed in kilograms. Generous enough for any real lifter. */
export const LIMITS = {
  /** 0.5 kg (an empty micro-plate) up to 600 kg (well past the world record). */
  weightKg: { min: 0.5, max: 600 },
  /** Above ~12 reps every 1RM formula degrades badly; 30 is the absolute cap. */
  reps: { min: 1, max: 30 },
  /** Bodyweight range used by the strength-standard scoring. */
  bodyweightKg: { min: 25, max: 300 },
  /** Bar mass: from a 5 kg technique bar to a 25 kg specialty bar. */
  barKg: { min: 0, max: 60 },
  /** Reps in reserve accepted by the RPE-adjusted estimate. */
  rir: { min: 0, max: 10 },
} as const;

/** Beyond this rep count the estimate is extrapolation, not measurement. */
export const HIGH_REP_WARNING_THRESHOLD = 12;

export type ValidationIssue = 'required' | 'not-a-number' | 'too-low' | 'too-high';

export interface ParseResult {
  ok: boolean;
  /** Present when `ok` is true; always in the canonical unit for the field. */
  value: number;
  issue?: ValidationIssue;
}

/**
 * Parse free-form user text into a bounded number.
 *
 * Accepts both `,` and `.` as the decimal separator, since a Spanish keyboard's
 * numeric pad emits a comma and typing "102,5" should not silently become 1025.
 */
export function parseNumber(
  raw: string | number | null | undefined,
  bounds: { min: number; max: number },
  options: { integer?: boolean } = {},
): ParseResult {
  if (raw === null || raw === undefined) return { ok: false, value: 0, issue: 'required' };

  let text = typeof raw === 'number' ? String(raw) : raw.trim();
  if (text === '') return { ok: false, value: 0, issue: 'required' };

  text = text.replace(',', '.');

  // Reject anything that isn't a plain decimal: this blocks `Infinity`, `1e999`,
  // hex literals and stray characters before they reach the formulas.
  if (!/^-?\d*\.?\d+$/.test(text)) return { ok: false, value: 0, issue: 'not-a-number' };

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return { ok: false, value: 0, issue: 'not-a-number' };

  const value = options.integer ? Math.round(parsed) : parsed;

  if (value < bounds.min) return { ok: false, value, issue: 'too-low' };
  if (value > bounds.max) return { ok: false, value, issue: 'too-high' };

  return { ok: true, value };
}

/** Parse a weight typed in `unit` and return it in kilograms. */
export function parseWeight(raw: string | number | null | undefined, unit: Unit): ParseResult {
  // Bounds are defined in kg, so widen them for pound entry before comparing.
  const factor = unit === 'kg' ? 1 : 1 / 0.45359237;
  const result = parseNumber(raw, {
    min: LIMITS.weightKg.min * factor,
    max: LIMITS.weightKg.max * factor,
  });
  if (!result.ok) return result;
  return { ok: true, value: unit === 'kg' ? result.value : result.value * 0.45359237 };
}

export function parseReps(raw: string | number | null | undefined): ParseResult {
  return parseNumber(raw, LIMITS.reps, { integer: true });
}

/** True when the rep count is high enough that the estimate should be caveated. */
export function isHighRepEstimate(reps: number): boolean {
  return reps > HIGH_REP_WARNING_THRESHOLD;
}
