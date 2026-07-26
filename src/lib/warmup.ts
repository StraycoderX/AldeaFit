/**
 * Warm-up ramp generation.
 *
 * Builds the progression from an empty bar to the working weight. The ramp
 * shortens as the working weight gets lighter — nobody needs five warm-up sets
 * to squat 60 kg — and every prescribed load is snapped to something the
 * available plates can actually make.
 */

import { roundToIncrement, round } from './units';
import { solvePlates, type PlateSpec, type PlateSolution } from './plates';

export interface WarmupSet {
  /** 1-indexed position in the ramp. */
  index: number;
  /** Percentage of the working weight. */
  percent: number;
  /** Prescribed load, snapped to a loadable increment. */
  weight: number;
  reps: number;
  /** Rest before the next set, in seconds. */
  restSeconds: number;
  /** Whether this is the working set rather than a warm-up. */
  isWorkingSet: boolean;
  plates: PlateSolution;
}

/**
 * Ramp templates keyed by how heavy the working set is relative to the bar.
 * Each entry is `[percentOfWorking, reps]`.
 */
const RAMPS: readonly (readonly (readonly [number, number])[])[] = [
  // Light working weight: bar plus one build-up set.
  [
    [0, 8],
    [65, 5],
  ],
  // Moderate.
  [
    [0, 8],
    [50, 5],
    [75, 3],
  ],
  // Heavy: the full five-step ramp.
  [
    [0, 8],
    [40, 5],
    [60, 4],
    [80, 2],
    [90, 1],
  ],
];

function pickRamp(workingWeight: number, bar: number): readonly (readonly [number, number])[] {
  const multiplesOfBar = bar > 0 ? workingWeight / bar : 4;
  if (multiplesOfBar < 2) return RAMPS[0] as readonly (readonly [number, number])[];
  if (multiplesOfBar < 3.5) return RAMPS[1] as readonly (readonly [number, number])[];
  return RAMPS[2] as readonly (readonly [number, number])[];
}

/** Rest scales with intensity: near-maximal sets need considerably longer. */
function restFor(percent: number): number {
  if (percent === 0) return 45;
  if (percent < 60) return 60;
  if (percent < 80) return 90;
  if (percent < 100) return 150;
  return 180;
}

export interface WarmupOptions {
  workingWeight: number;
  workingReps: number;
  bar: number;
  inventory: PlateSpec[];
  increment: number;
}

/**
 * Generate the full session ramp, ending with the working set.
 *
 * Sets that round to the same load as the previous one are dropped, which keeps
 * the ramp sensible for light working weights where 40% and 60% of the bar-plus
 * total both snap to "just the bar".
 */
export function generateWarmup(options: WarmupOptions): WarmupSet[] {
  const { workingWeight, workingReps, bar, inventory, increment } = options;

  if (workingWeight <= 0) return [];

  const ramp = pickRamp(workingWeight, bar);
  const sets: WarmupSet[] = [];
  let lastWeight = -1;

  for (const entry of ramp) {
    const [percent, reps] = entry;

    // 0% means the bare bar; anything else snaps to a loadable increment and is
    // floored at the bar, since you cannot load less than the bar itself.
    const raw = percent === 0 ? bar : Math.max(bar, (workingWeight * percent) / 100);
    const weight = percent === 0 ? bar : roundToIncrement(raw, increment);

    // Skip duplicates and anything that already reaches the working weight.
    if (weight <= lastWeight || weight >= workingWeight) continue;

    sets.push({
      index: sets.length + 1,
      percent,
      weight: round(weight, 2),
      reps,
      restSeconds: restFor(percent),
      isWorkingSet: false,
      plates: solvePlates(weight, bar, inventory),
    });
    lastWeight = weight;
  }

  sets.push({
    index: sets.length + 1,
    percent: 100,
    weight: round(workingWeight, 2),
    reps: workingReps,
    restSeconds: restFor(100),
    isWorkingSet: true,
    plates: solvePlates(workingWeight, bar, inventory),
  });

  return sets;
}

/** Total estimated time for a ramp, in seconds (rest plus ~4s per rep). */
export function estimateDuration(sets: WarmupSet[]): number {
  return sets.reduce((total, set) => total + set.restSeconds + set.reps * 4, 0);
}
