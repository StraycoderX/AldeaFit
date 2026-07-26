/**
 * One-repetition-maximum estimation.
 *
 * Most online calculators pick a single formula (usually Epley) and present its
 * output as a fact. In reality the published formulas disagree by 5-10% at
 * moderate rep ranges and diverge sharply past ~10 reps. AldeaFit runs seven of
 * them, reports the median as the headline number, and shows the spread so the
 * lifter can see how much confidence the estimate actually deserves.
 *
 * References:
 *  - Epley, B. (1985). Poundage Chart. Boyd Epley Workout.
 *  - Brzycki, M. (1993). Strength testing: predicting a 1-RM from reps-to-fatigue.
 *  - Lombardi, V. P. (1989). Beginning Weight Training.
 *  - O'Conner, B. et al. (1989). Weight Training Today.
 *  - Wathan, D. (1994). Load assignment. In: Essentials of S&C.
 *  - Lander, J. (1985). Maximums based on reps.
 *  - Mayhew, J. L. et al. (1992). Muscular endurance repetitions to predict 1RM.
 */

import { round } from './units';

export type FormulaId =
  | 'epley'
  | 'brzycki'
  | 'lombardi'
  | 'oconner'
  | 'wathan'
  | 'lander'
  | 'mayhew';

export interface Formula {
  id: FormulaId;
  name: string;
  /** Estimate a 1RM from a load and the reps completed with it. */
  oneRm: (weight: number, reps: number) => number;
  /**
   * Highest rep count the formula is considered usable at. Brzycki and Lander
   * both approach a vertical asymptote near 37 reps, so they are capped lower.
   */
  maxReps: number;
}

export const FORMULAS: readonly Formula[] = [
  {
    id: 'epley',
    name: 'Epley',
    oneRm: (w, r) => w * (1 + r / 30),
    maxReps: 30,
  },
  {
    id: 'brzycki',
    name: 'Brzycki',
    oneRm: (w, r) => w * (36 / (37 - r)),
    maxReps: 15,
  },
  {
    id: 'lombardi',
    name: 'Lombardi',
    oneRm: (w, r) => w * Math.pow(r, 0.1),
    maxReps: 30,
  },
  {
    id: 'oconner',
    name: "O'Conner",
    oneRm: (w, r) => w * (1 + r / 40),
    maxReps: 30,
  },
  {
    id: 'wathan',
    name: 'Wathan',
    oneRm: (w, r) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
    maxReps: 30,
  },
  {
    id: 'lander',
    name: 'Lander',
    oneRm: (w, r) => (100 * w) / (101.3 - 2.67123 * r),
    maxReps: 15,
  },
  {
    id: 'mayhew',
    name: 'Mayhew',
    oneRm: (w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
    maxReps: 30,
  },
] as const;

export interface FormulaEstimate {
  id: FormulaId;
  name: string;
  value: number;
  /** False when the rep count is outside the formula's usable range. */
  applicable: boolean;
}

export interface OneRmResult {
  /** Median across the applicable formulas — the headline number. */
  consensus: number;
  /** Lowest applicable estimate. */
  low: number;
  /** Highest applicable estimate. */
  high: number;
  /** Half-width of the spread as a percentage of the consensus. */
  spreadPercent: number;
  /** How much the estimate can be trusted, derived from reps and spread. */
  confidence: 'high' | 'medium' | 'low';
  estimates: FormulaEstimate[];
}

/** Median of a numeric list. Assumes a non-empty input. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] as number;
  return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/**
 * Estimate a 1RM from a completed set.
 *
 * A single rep is returned unchanged. Several of the formulas do *not* collapse
 * to `weight` at r = 1 — Epley gives 103.3% and Mayhew 108.9% — because they
 * were fitted over multi-rep sets and were never meant to be evaluated there.
 * Taking their median would tell a lifter who just pressed 100 kg for one that
 * their max is 101.4 kg, which is both wrong and an invitation to fail a rep.
 * A single completed rep is a measurement, not an estimate.
 */
export function estimateOneRm(weight: number, reps: number): OneRmResult {
  if (reps <= 1) {
    const exact = round(weight, 1);
    return {
      consensus: exact,
      low: exact,
      high: exact,
      spreadPercent: 0,
      confidence: 'high',
      estimates: FORMULAS.map((formula) => ({
        id: formula.id,
        name: formula.name,
        value: exact,
        applicable: true,
      })),
    };
  }

  const estimates: FormulaEstimate[] = FORMULAS.map((formula) => {
    const applicable = reps <= formula.maxReps;
    const raw = applicable ? formula.oneRm(weight, reps) : 0;
    return {
      id: formula.id,
      name: formula.name,
      // Guard against a formula's asymptote producing a negative or infinite value.
      value: Number.isFinite(raw) && raw > 0 ? round(raw, 1) : 0,
      applicable: applicable && Number.isFinite(raw) && raw > 0,
    };
  });

  const usable = estimates.filter((e) => e.applicable).map((e) => e.value);

  // Should never happen for validated input, but never divide by an empty set.
  if (usable.length === 0) {
    return {
      consensus: round(weight, 1),
      low: round(weight, 1),
      high: round(weight, 1),
      spreadPercent: 0,
      confidence: 'low',
      estimates,
    };
  }

  const consensus = round(median(usable), 1);
  const low = round(Math.min(...usable), 1);
  const high = round(Math.max(...usable), 1);
  const spreadPercent = consensus > 0 ? round(((high - low) / 2 / consensus) * 100, 1) : 0;

  // Reps drive confidence more than spread does: the formulas were all fitted on
  // sets of roughly 1-10 reps, so agreement at 20 reps is agreement on a guess.
  let confidence: OneRmResult['confidence'];
  if (reps <= 6 && spreadPercent <= 4) confidence = 'high';
  else if (reps <= 12 && spreadPercent <= 8) confidence = 'medium';
  else confidence = 'low';

  return { consensus, low, high, spreadPercent, confidence, estimates };
}

/**
 * Estimate a 1RM from a set taken short of failure.
 *
 * RIR (reps in reserve) is the modern autoregulation standard: a set of 5 with
 * 2 left in the tank predicts the same 1RM as a set of 7 to failure. Converting
 * to "effective reps" and reusing the same formulas keeps the two paths
 * consistent rather than introducing a second, disagreeing model.
 */
export function estimateOneRmFromRir(weight: number, reps: number, rir: number): OneRmResult {
  return estimateOneRm(weight, reps + rir);
}

/**
 * Percentage of 1RM that a given rep count represents, per the consensus model.
 *
 * Derived by inverting the estimate rather than hard-coding a lookup table, so
 * the percentage chart and the calculator can never drift apart.
 */
export function percentOfOneRm(reps: number): number {
  if (reps <= 1) return 100;
  const result = estimateOneRm(100, reps);
  return round((100 / result.consensus) * 100, 1);
}

/** Load that should permit `reps` repetitions, given a 1RM. */
export function weightForReps(oneRm: number, reps: number): number {
  return round((oneRm * percentOfOneRm(reps)) / 100, 1);
}

/** Reps expected at a given percentage of 1RM. Inverse of `percentOfOneRm`. */
export function repsForPercent(percent: number): number {
  if (percent >= 100) return 1;
  if (percent <= 0) return 0;
  // The relationship has no closed-form inverse across seven formulas, so walk
  // the rep range and take the closest match. The range is tiny (30 items).
  let best = 1;
  let bestDelta = Infinity;
  for (let reps = 1; reps <= 30; reps += 1) {
    const delta = Math.abs(percentOfOneRm(reps) - percent);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = reps;
    }
  }
  return best;
}
