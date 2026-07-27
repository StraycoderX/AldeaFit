/**
 * One-repetition-maximum estimation.
 *
 * ## Why the classical formulas all agree
 *
 * Epley, Brzycki, Lombardi, O'Conner, Wathan, Lander and Mayhew were fitted in
 * the 1980s–90s on small lab samples, mostly bench press, and every one of them
 * is **linear in the load**: they compute `weight × f(reps)`. The multiplier for
 * 5 reps is the same whether you moved 20 kg or 200 kg. That is why they cluster
 * within a few percent of each other and why showing seven of them adds less
 * information than it appears to — they are seven slightly different constants
 * applied to the same shape.
 *
 * Real training does not work that way. The reps you can grind at a given
 * percentage of your max depend on the movement: Hoeger et al. measured ~34
 * reps at 60% 1RM on the leg press against ~11 on knee flexion, and Nuzzo et
 * al.'s 2024 meta-regression of 952 tests across 7,289 people found **exercise
 * to be the only moderator that meaningfully shifts the curve** — sex, age and
 * training status barely move it.
 *
 * ## The primary model
 *
 * AldeaFit's headline number therefore comes from Marzagão (2026), fitted on
 * 303,494 near-failure sets logged by 14,966 people across 388 exercises in a
 * consumer training app:
 *
 *     1RM = w · ( 1 + (r − 1)^0.85 / ( −2.55 + 4.58 · ln w ) )
 *
 * The denominator makes the conversion factor depend on the **absolute load**,
 * which is what lets one equation behave differently on a 200 kg deadlift and a
 * 12 kg lateral raise without being told which exercise it is. It reduced
 * prediction inconsistency by 17–22% against all four classical benchmarks, and
 * improved on them for every one of the 183 exercises with enough data.
 *
 * ## Units
 *
 * `ln w` is **not** scale-invariant — `ln(k·w) = ln k + ln w` — so the unit the
 * equation was fitted in changes the answer by up to ~5% and cannot be ignored.
 * The source preprint was unreachable, so the unit was inferred by testing both
 * against published bench-press loading anchors (≈2 reps at 95%, ≈4 at 90%,
 * ≈8-9 at 80%, ≈12-13 at 70%). Pounds fit roughly twice as well as kilograms
 * (RMSE 0.64 vs 1.28 reps), which also matches the US origin of the dataset.
 * Loads are therefore converted to pounds before the equation is applied.
 * `onerm.test.ts` pins those anchors so a wrong unit fails the suite.
 *
 * References:
 *  - Marzagão, T. (2026). A Weight-Dependent 1RM Prediction Equation Optimized
 *    on 303,494 Near-Failure Sets Across 388 Exercises.
 *  - Nuzzo, J. L. et al. (2024). Maximal Number of Repetitions at Percentages
 *    of the One Repetition Maximum. Sports Medicine.
 *  - Hoeger, W. W. K. et al. (1990). Relationship between repetitions and
 *    selected percentages of one repetition maximum. JSCR.
 *  - Epley (1985), Brzycki (1993), Lombardi (1989), O'Conner (1989),
 *    Wathan (1994), Lander (1985), Mayhew (1992).
 */

import { round, KG_PER_LB } from './units';

export type FormulaId =
  | 'gymdata'
  | 'epley'
  | 'brzycki'
  | 'lombardi'
  | 'oconner'
  | 'wathan'
  | 'lander'
  | 'mayhew';

/* ------------------------------------------------------------------ */
/* Primary model — weight-dependent, fitted on logged gym sets         */
/* ------------------------------------------------------------------ */

/** Sub-linear exponent on the rep count. */
const REP_EXPONENT = 0.85;
/** Intercept and slope of the load-dependent conversion factor k(w). */
const K_INTERCEPT = -2.55;
const K_SLOPE = 4.58;

/**
 * Lightest load the equation is evaluated at, in pounds.
 *
 * k(w) crosses zero at `exp(2.55 / 4.58) ≈ 1.75 lb`, so the conversion factor
 * collapses towards it and the predicted max runs away: at 2 lb a 5-rep set
 * already implies a 6x multiplier. 5 lb is the lightest load anyone does a real
 * working set with — the smallest plate or dumbbell in a gym — and keeps the
 * worst case across the whole rep range under ~3.5x. Anything lighter is
 * evaluated as if it were 5 lb rather than trusted.
 */
const MIN_LB = 5;

function conversionFactor(weightLb: number): number {
  return K_INTERCEPT + K_SLOPE * Math.log(Math.max(weightLb, MIN_LB));
}

/**
 * Estimate a 1RM in kilograms from a set taken to (or near) failure.
 *
 * Both argument and result are kilograms; the pound conversion the equation
 * requires happens internally so callers never deal with it.
 */
export function gymDataOneRm(weightKg: number, reps: number): number {
  if (weightKg <= 0) return 0;
  if (reps <= 1) return weightKg;

  const weightLb = weightKg / KG_PER_LB;
  const k = conversionFactor(weightLb);
  if (k <= 0) return weightKg;

  return weightKg * (1 + Math.pow(reps - 1, REP_EXPONENT) / k);
}

/* ------------------------------------------------------------------ */
/* Classical formulas — kept for comparison                            */
/* ------------------------------------------------------------------ */

export interface Formula {
  id: FormulaId;
  name: string;
  /** Estimate a 1RM (kg) from a load (kg) and the reps completed with it. */
  oneRm: (weightKg: number, reps: number) => number;
  /** Highest rep count the formula stays usable at. */
  maxReps: number;
  /** True for the load-dependent model, false for the linear classics. */
  weightDependent: boolean;
}

export const PRIMARY_FORMULA: Formula = {
  id: 'gymdata',
  name: 'AldeaFit',
  oneRm: gymDataOneRm,
  maxReps: 20,
  weightDependent: true,
};

/** The seven classical equations, all linear in the load. */
export const CLASSICAL_FORMULAS: readonly Formula[] = [
  { id: 'epley', name: 'Epley', oneRm: (w, r) => w * (1 + r / 30), maxReps: 30, weightDependent: false },
  { id: 'brzycki', name: 'Brzycki', oneRm: (w, r) => w * (36 / (37 - r)), maxReps: 15, weightDependent: false },
  { id: 'lombardi', name: 'Lombardi', oneRm: (w, r) => w * Math.pow(r, 0.1), maxReps: 30, weightDependent: false },
  { id: 'oconner', name: "O'Conner", oneRm: (w, r) => w * (1 + r / 40), maxReps: 30, weightDependent: false },
  {
    id: 'wathan',
    name: 'Wathan',
    oneRm: (w, r) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
    maxReps: 30,
    weightDependent: false,
  },
  {
    id: 'lander',
    name: 'Lander',
    oneRm: (w, r) => (100 * w) / (101.3 - 2.67123 * r),
    maxReps: 15,
    weightDependent: false,
  },
  {
    id: 'mayhew',
    name: 'Mayhew',
    oneRm: (w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
    maxReps: 30,
    weightDependent: false,
  },
] as const;

export const FORMULAS: readonly Formula[] = [PRIMARY_FORMULA, ...CLASSICAL_FORMULAS];

export interface FormulaEstimate {
  id: FormulaId;
  name: string;
  value: number;
  /** False when the rep count is outside the formula's usable range. */
  applicable: boolean;
  weightDependent: boolean;
}

export interface OneRmResult {
  /** Headline estimate, from the gym-data model. */
  estimate: number;
  /** Lowest classical estimate, for the uncertainty band. */
  low: number;
  /** Highest classical estimate. */
  high: number;
  /** How far the classical formulas disagree, as ± percent of the estimate. */
  spreadPercent: number;
  confidence: 'high' | 'medium' | 'low';
  /** Primary first, then the classical comparison set. */
  estimates: FormulaEstimate[];
}

/**
 * Estimate a 1RM from a completed set.
 *
 * A single rep is returned unchanged. Several classical formulas do not
 * collapse to the load at r = 1 — Epley gives 103.3% and Mayhew 108.9% —
 * because they were fitted over multi-rep sets and were never meant to be
 * evaluated there. Telling a lifter who just pressed 100 kg that their max is
 * 101.4 kg is both wrong and an invitation to fail a rep: one completed rep is
 * a measurement, not an estimate.
 */
export function estimateOneRm(weightKg: number, reps: number): OneRmResult {
  const buildEstimates = (value: (f: Formula) => number, applicable: (f: Formula) => boolean) =>
    FORMULAS.map<FormulaEstimate>((formula) => {
      const raw = applicable(formula) ? value(formula) : 0;
      const usable = applicable(formula) && Number.isFinite(raw) && raw > 0;
      return {
        id: formula.id,
        name: formula.name,
        value: usable ? round(raw, 1) : 0,
        applicable: usable,
        weightDependent: formula.weightDependent,
      };
    });

  if (reps <= 1) {
    const exact = round(weightKg, 1);
    return {
      estimate: exact,
      low: exact,
      high: exact,
      spreadPercent: 0,
      confidence: 'high',
      estimates: buildEstimates(() => weightKg, () => true),
    };
  }

  const estimates = buildEstimates(
    (formula) => formula.oneRm(weightKg, reps),
    (formula) => reps <= formula.maxReps,
  );

  const estimate = round(gymDataOneRm(weightKg, reps), 1);

  // The band comes from the classical spread: it is a measure of how much the
  // published equations disagree, which is the honest uncertainty to show.
  const classical = estimates
    .filter((e) => e.id !== 'gymdata' && e.applicable)
    .map((e) => e.value);

  const low = classical.length > 0 ? round(Math.min(...classical, estimate), 1) : estimate;
  const high = classical.length > 0 ? round(Math.max(...classical, estimate), 1) : estimate;
  const spreadPercent = estimate > 0 ? round(((high - low) / 2 / estimate) * 100, 1) : 0;

  // Reps drive confidence more than spread: every one of these models was
  // fitted on sets of roughly 1-12 reps, so agreement at 20 reps is agreement
  // on an extrapolation.
  let confidence: OneRmResult['confidence'];
  if (reps <= 6 && spreadPercent <= 4) confidence = 'high';
  else if (reps <= 12 && spreadPercent <= 8) confidence = 'medium';
  else confidence = 'low';

  return { estimate, low, high, spreadPercent, confidence, estimates };
}

/**
 * Estimate a 1RM from a set stopped short of failure.
 *
 * RIR (reps in reserve) is the modern autoregulation standard: a set of 5 with
 * 2 left in the tank predicts the same max as a set of 7 to failure. Converting
 * to effective reps and reusing the same model keeps both paths consistent
 * rather than introducing a second, disagreeing one.
 */
export function estimateOneRmFromRir(weightKg: number, reps: number, rir: number): OneRmResult {
  return estimateOneRm(weightKg, reps + rir);
}

/* ------------------------------------------------------------------ */
/* Inverses — load for a rep target, and vice versa                    */
/* ------------------------------------------------------------------ */

/**
 * Load that should permit `reps` repetitions, given a 1RM.
 *
 * The primary model has no closed-form inverse: the unknown load appears both
 * outside and inside a logarithm. It is strictly increasing in the load though,
 * so a bisection converges quickly and exactly enough for a barbell.
 *
 * This is the step that makes the percentage table load-aware. Under the
 * classical formulas, 80% of a 60 kg max and 80% of a 250 kg max implied the
 * same rep count; here they do not, which is the whole point.
 */
export function weightForReps(oneRmKg: number, reps: number): number {
  if (oneRmKg <= 0) return 0;
  if (reps <= 1) return round(oneRmKg, 1);

  let low = 0.01;
  let high = oneRmKg;

  // 60 iterations halves the interval far past double precision.
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (gymDataOneRm(mid, reps) < oneRmKg) low = mid;
    else high = mid;
  }

  return round((low + high) / 2, 1);
}

/** Percentage of a given 1RM that a `reps`-rep set represents. */
export function percentOfOneRm(reps: number, oneRmKg: number): number {
  if (oneRmKg <= 0) return 0;
  if (reps <= 1) return 100;
  return round((weightForReps(oneRmKg, reps) / oneRmKg) * 100, 1);
}

/** Reps expected at a percentage of a 1RM. Inverse of `percentOfOneRm`. */
export function repsForPercent(percent: number, oneRmKg: number): number {
  if (percent >= 100 || oneRmKg <= 0) return 1;
  if (percent <= 0) return 0;

  // The rep range is small enough to scan; picking the closest match avoids
  // another bisection and keeps this exactly consistent with the forward path.
  let best = 1;
  let bestDelta = Infinity;
  for (let reps = 1; reps <= 30; reps += 1) {
    const delta = Math.abs(percentOfOneRm(reps, oneRmKg) - percent);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = reps;
    }
  }
  return best;
}
