/**
 * Relative strength scoring and experience levels.
 *
 * Raw kilograms say little on their own — 100 kg on the bench means something
 * very different at 60 kg bodyweight than at 110 kg. Two complementary views:
 *
 *  1. DOTS, the bodyweight-normalised coefficient that replaced Wilks as the
 *     IPF-adjacent standard for comparing lifters across weight classes.
 *  2. A strength-to-bodyweight ratio table mapping a lift onto the usual
 *     beginner → elite ladder.
 *
 * DOTS coefficients: Reactive Training Systems / OpenPowerlifting reference
 * implementation of the 2019 formula.
 */

import { clamp, round } from './units';

export type Sex = 'male' | 'female';

export type LiftId = 'squat' | 'bench' | 'deadlift' | 'ohp' | 'row' | 'other';

export interface Lift {
  id: LiftId;
  /** Translation key suffix; the label itself lives in the i18n dictionary. */
  key: string;
}

export const LIFTS: readonly Lift[] = [
  { id: 'squat', key: 'squat' },
  { id: 'bench', key: 'bench' },
  { id: 'deadlift', key: 'deadlift' },
  { id: 'ohp', key: 'ohp' },
  { id: 'row', key: 'row' },
  { id: 'other', key: 'other' },
] as const;

/** Polynomial coefficients, highest order first, for the DOTS denominator. */
const DOTS_COEFFICIENTS: Record<Sex, readonly number[]> = {
  male: [-0.000001093, 0.0007391293, -0.1918759221, 24.0900756, -307.75076],
  female: [-0.0000010706, 0.0005158568, -0.1126655495, 13.6175032, -57.96288],
};

/** Bodyweight range the DOTS polynomial is fitted over, in kilograms. */
const DOTS_BOUNDS: Record<Sex, { min: number; max: number }> = {
  male: { min: 40, max: 210 },
  female: { min: 40, max: 150 },
};

/**
 * DOTS score for a lift. Higher is better; ~500 is roughly national level.
 * Returns 0 for non-positive input rather than throwing, so the UI can render
 * an empty state without special-casing.
 */
export function dots(totalKg: number, bodyweightKg: number, sex: Sex): number {
  if (totalKg <= 0 || bodyweightKg <= 0) return 0;

  const bounds = DOTS_BOUNDS[sex];
  // Outside the fitted range the polynomial turns over and produces nonsense,
  // so clamp the input rather than reporting a wildly wrong score.
  const bw = clamp(bodyweightKg, bounds.min, bounds.max);
  const coefficients = DOTS_COEFFICIENTS[sex];

  const denominator = coefficients.reduce((acc, c) => acc * bw + c, 0);
  if (denominator === 0) return 0;

  return round((500 / denominator) * totalKg, 1);
}

export type StrengthLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite';

export const STRENGTH_LEVELS: readonly StrengthLevel[] = [
  'beginner',
  'novice',
  'intermediate',
  'advanced',
  'elite',
] as const;

/**
 * Strength-to-bodyweight ratio thresholds per lift.
 *
 * Each tuple is the ratio at which a lifter enters that level, ordered
 * beginner → elite. Values follow the widely used ExRx / strength-standards
 * consensus for raw, drug-free lifters.
 */
const RATIO_TABLE: Record<LiftId, Record<Sex, readonly number[]>> = {
  squat: {
    male: [0.75, 1.25, 1.75, 2.5, 3.25],
    female: [0.5, 0.85, 1.25, 1.85, 2.5],
  },
  bench: {
    male: [0.5, 0.85, 1.25, 1.75, 2.25],
    female: [0.3, 0.5, 0.75, 1.1, 1.5],
  },
  deadlift: {
    male: [1.0, 1.5, 2.1, 2.85, 3.6],
    female: [0.6, 1.0, 1.5, 2.15, 2.85],
  },
  ohp: {
    male: [0.35, 0.55, 0.8, 1.1, 1.4],
    female: [0.2, 0.35, 0.5, 0.7, 0.95],
  },
  row: {
    male: [0.5, 0.75, 1.05, 1.4, 1.8],
    female: [0.3, 0.5, 0.7, 0.95, 1.25],
  },
  // No published table for "other"; reuse the bench ratios as a neutral proxy.
  other: {
    male: [0.5, 0.85, 1.25, 1.75, 2.25],
    female: [0.3, 0.5, 0.75, 1.1, 1.5],
  },
};

export interface StrengthAssessment {
  ratio: number;
  level: StrengthLevel;
  /** Progress toward the next level, 0-1. Saturates at 1 for elite lifters. */
  progress: number;
  /** Load needed to reach the next level, or null when already elite. */
  nextLevelKg: number | null;
  nextLevel: StrengthLevel | null;
  /** Threshold ratios for this lift and sex, for rendering the full ladder. */
  thresholds: readonly number[];
}

/** Place a 1RM on the beginner → elite ladder for its lift. */
export function assessStrength(
  oneRmKg: number,
  bodyweightKg: number,
  lift: LiftId,
  sex: Sex,
): StrengthAssessment {
  const thresholds = RATIO_TABLE[lift][sex];
  const ratio = bodyweightKg > 0 ? round(oneRmKg / bodyweightKg, 2) : 0;

  // Index of the highest threshold the lifter has cleared; -1 means below entry.
  let index = -1;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (ratio >= (thresholds[i] as number)) index = i;
  }

  const level = STRENGTH_LEVELS[Math.max(index, 0)] as StrengthLevel;
  const isElite = index >= thresholds.length - 1;

  if (isElite) {
    return { ratio, level: 'elite', progress: 1, nextLevelKg: null, nextLevel: null, thresholds };
  }

  const nextIndex = index + 1;
  const floor = index >= 0 ? (thresholds[index] as number) : 0;
  const ceiling = thresholds[nextIndex] as number;
  const span = ceiling - floor;
  const progress = span > 0 ? clamp((ratio - floor) / span, 0, 1) : 0;

  return {
    ratio,
    level,
    progress: round(progress, 3),
    nextLevelKg: round(ceiling * bodyweightKg, 1),
    nextLevel: STRENGTH_LEVELS[nextIndex] as StrengthLevel,
    thresholds,
  };
}
