import { describe, expect, it } from 'vitest';
import { EXERCISE_PROFILES, adjustsEstimate, effectiveReps } from './exercises';
import { estimateOneRmForLift } from './onerm';

describe('effectiveReps', () => {
  it('never rescales a single rep — it is a measurement on any lift', () => {
    for (const lift of Object.keys(EXERCISE_PROFILES) as (keyof typeof EXERCISE_PROFILES)[]) {
      expect(effectiveReps(1, lift)).toBe(1);
    }
  });

  it('leaves the bench press unchanged, as the reference movement', () => {
    expect(effectiveReps(8, 'bench')).toBe(8);
    expect(adjustsEstimate('bench')).toBe(false);
  });

  it('compresses reps for movements that sustain more of them', () => {
    // A squat allows more reps at a given %1RM, so 8 squat reps are worth
    // fewer bench-equivalent reps.
    expect(effectiveReps(8, 'squat')).toBeLessThan(8);
    expect(effectiveReps(8, 'ohp')).toBeGreaterThan(8);
  });
});

describe('estimateOneRmForLift', () => {
  it('actually changes the estimate between exercises — the picker is not inert', () => {
    const squat = estimateOneRmForLift(100, 5, 0, 'squat').estimate;
    const bench = estimateOneRmForLift(100, 5, 0, 'bench').estimate;
    const ohp = estimateOneRmForLift(100, 5, 0, 'ohp').estimate;

    expect(squat).not.toBe(bench);
    expect(ohp).not.toBe(bench);
    // Squat sustains more reps, so the same set implies a lower max.
    expect(squat).toBeLessThan(bench);
    expect(ohp).toBeGreaterThan(bench);
  });

  it('keeps the adjustment modest, matching the strength of the evidence', () => {
    const bench = estimateOneRmForLift(100, 5, 0, 'bench').estimate;
    for (const lift of ['squat', 'deadlift', 'row', 'ohp'] as const) {
      const value = estimateOneRmForLift(100, 5, 0, lift).estimate;
      expect(Math.abs(value - bench) / bench).toBeLessThan(0.06);
    }
  });

  it('collapses to a single value at one rep, whatever the exercise', () => {
    const values = (['squat', 'bench', 'deadlift', 'ohp'] as const).map(
      (lift) => estimateOneRmForLift(120, 1, 0, lift).estimate,
    );
    expect(new Set(values).size).toBe(1);
    expect(values[0]).toBe(120);
  });

  it('still folds RIR in', () => {
    expect(estimateOneRmForLift(100, 5, 2, 'squat').estimate).toBe(
      estimateOneRmForLift(100, 7, 0, 'squat').estimate,
    );
  });
});
