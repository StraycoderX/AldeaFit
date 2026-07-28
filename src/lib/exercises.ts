/**
 * Exercise-specific rep capacity.
 *
 * ## What is established
 *
 * Nuzzo et al.'s 2024 meta-regression (952 tests, 7,289 people) found the
 * **exercise to be the only moderator that meaningfully shifts** the
 * reps-versus-%1RM curve; sex, age and training status barely move it. The
 * direction is consistent across the literature:
 *
 *  - Hoeger et al. (1990): ~34 reps at 60% 1RM on the leg press against ~11 on
 *    knee flexion.
 *  - Shimano et al. (2006): significantly more reps on the back squat than on
 *    the bench press or arm curl at 60% 1RM, in both trained and untrained men,
 *    attributed to the larger muscle mass recruited.
 *
 * ## What is not
 *
 * The per-exercise tables themselves sit behind paywalls, so the **magnitudes
 * below are a deliberate approximation of a documented direction, not fitted
 * coefficients**. They are kept small on purpose: enough to stop the app
 * claiming a squat and a bench press behave identically, not enough to invent
 * precision that the accessible evidence does not support.
 *
 * Worth stating plainly: the between-study spread is larger than the effect
 * modelled here. Stronger by Science's review reports trained men averaging 14
 * reps at 70% 1RM on the free-weight squat but 9.6 on the Smith machine squat —
 * the *same* exercise pattern, at the *same* relative load, differing more than
 * squat differs from bench. These coefficients therefore encode a direction
 * worth respecting, not a precision worth trusting to the decimal.
 *
 * The deadlift is the honest weak spot. It is a large-muscle-mass lower-body
 * lift, which argues for high rep capacity, but it starts from a dead stop with
 * no stretch-shortening rebound and is often limited by grip and erectors,
 * which argues for low. No accessible source settles it, so it is grouped with
 * the lower body at half the squat's adjustment rather than being guessed at.
 *
 * The UI shows the resulting adjustment explicitly, so a lifter can see what
 * picking an exercise did to their number instead of it moving invisibly.
 */

import type { LiftId } from './standards';

export interface ExerciseProfile {
  id: LiftId;
  /**
   * Reps achievable at a fixed %1RM, relative to the bench press.
   *
   * Above 1 means the movement sustains more reps at the same relative load,
   * which makes a given rep count correspond to a *heavier* percentage and so a
   * *lower* estimated max.
   */
  repCapacity: number;
}

/**
 * The bench press is the reference at 1.0: it is what the classical formulas
 * were fitted on and the anchor the primary model was unit-checked against.
 */
export const EXERCISE_PROFILES: Record<LiftId, ExerciseProfile> = {
  // Largest muscle mass, clearest evidence for extra rep capacity.
  squat: { id: 'squat', repCapacity: 1.3 },
  // Lower body, but dead-stop and grip-limited. Half the squat's adjustment.
  deadlift: { id: 'deadlift', repCapacity: 1.15 },
  bench: { id: 'bench', repCapacity: 1.0 },
  // Upper-body pull, comparable mass to a press; a touch more capacity.
  row: { id: 'row', repCapacity: 1.05 },
  // Smallest muscle mass of the barbell lifts and stability-limited overhead.
  ohp: { id: 'ohp', repCapacity: 0.92 },
  // No basis to adjust an unknown movement.
  other: { id: 'other', repCapacity: 1.0 },
};

/**
 * Convert reps performed on `lift` into the bench-equivalent rep count the
 * primary model expects.
 *
 * A single rep is a measurement on any exercise, so it is never rescaled — only
 * the reps beyond the first are.
 */
export function effectiveReps(reps: number, lift: LiftId): number {
  if (reps <= 1) return reps;
  const { repCapacity } = EXERCISE_PROFILES[lift];
  return 1 + (reps - 1) / repCapacity;
}

/** True when picking this exercise changes the result at all. */
export function adjustsEstimate(lift: LiftId): boolean {
  return EXERCISE_PROFILES[lift].repCapacity !== 1;
}
