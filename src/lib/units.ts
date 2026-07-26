/**
 * Units and numeric helpers.
 *
 * Internally the whole app stores mass in kilograms; `Unit` only ever affects
 * presentation and the plate inventory. Keeping one canonical unit avoids the
 * class of bug where a saved record silently changes meaning when the user
 * flips the unit toggle.
 */

export type Unit = 'kg' | 'lb';

export const KG_PER_LB = 0.45359237;

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

/** Convert a canonical kilogram value into the display unit. */
export function fromKg(kg: number, unit: Unit): number {
  return unit === 'kg' ? kg : kgToLb(kg);
}

/** Convert a value entered in the display unit back to canonical kilograms. */
export function toKg(value: number, unit: Unit): number {
  return unit === 'kg' ? value : lbToKg(value);
}

/** Round to `decimals` places without the float drift of `toFixed` round-trips. */
export function round(value: number, decimals = 1): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  // The epsilon nudge keeps values like 2.675 from rounding down to 2.67.
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Round to the nearest achievable increment (e.g. 2.5 kg jumps on a barbell). */
export function roundToIncrement(value: number, increment: number): number {
  if (increment <= 0 || !Number.isFinite(increment)) return value;
  return round(Math.round(value / increment) * increment, 3);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a load for display. Weights are shown with at most one decimal, and
 * the trailing `.0` is dropped so "100 kg" doesn't read as "100.0 kg".
 */
export function formatWeight(kg: number, unit: Unit, decimals = 1): string {
  const value = round(fromKg(kg, unit), decimals);
  return Number.isInteger(value) ? String(value) : value.toFixed(decimals);
}

export function unitLabel(unit: Unit): string {
  return unit;
}
