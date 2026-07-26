import { describe, expect, it } from 'vitest';
import { estimateDuration, generateWarmup } from './warmup';
import { DEFAULT_PLATES_KG, smallestIncrement } from './plates';

const options = {
  bar: 20,
  inventory: DEFAULT_PLATES_KG.map((p) => ({ ...p, count: 40 })),
  increment: smallestIncrement(DEFAULT_PLATES_KG),
};

describe('generateWarmup', () => {
  it('returns nothing for a non-positive working weight', () => {
    expect(generateWarmup({ ...options, workingWeight: 0, workingReps: 5 })).toEqual([]);
  });

  it('always ends with the working set', () => {
    const sets = generateWarmup({ ...options, workingWeight: 140, workingReps: 3 });
    const last = sets.at(-1);
    expect(last?.isWorkingSet).toBe(true);
    expect(last?.weight).toBe(140);
    expect(last?.reps).toBe(3);
    expect(sets.filter((s) => s.isWorkingSet)).toHaveLength(1);
  });

  it('ramps strictly upward with no repeated loads', () => {
    const sets = generateWarmup({ ...options, workingWeight: 160, workingReps: 5 });
    for (let i = 1; i < sets.length; i += 1) {
      expect(sets[i]!.weight).toBeGreaterThan(sets[i - 1]!.weight);
    }
  });

  it('never prescribes less than the bar', () => {
    const sets = generateWarmup({ ...options, workingWeight: 30, workingReps: 8 });
    for (const set of sets) {
      expect(set.weight).toBeGreaterThanOrEqual(20);
    }
  });

  it('uses a longer ramp for a heavier session', () => {
    const light = generateWarmup({ ...options, workingWeight: 35, workingReps: 5 });
    const heavy = generateWarmup({ ...options, workingWeight: 180, workingReps: 5 });
    expect(heavy.length).toBeGreaterThan(light.length);
  });

  it('snaps every warm-up load to something the plates can build', () => {
    const sets = generateWarmup({ ...options, workingWeight: 137.5, workingReps: 3 });
    for (const set of sets) {
      if (set.isWorkingSet) continue;
      expect(set.plates.exact).toBe(true);
    }
  });

  it('numbers sets consecutively from one', () => {
    const sets = generateWarmup({ ...options, workingWeight: 120, workingReps: 5 });
    expect(sets.map((s) => s.index)).toEqual(sets.map((_, i) => i + 1));
  });

  it('rests longest before the working set', () => {
    const sets = generateWarmup({ ...options, workingWeight: 150, workingReps: 3 });
    const working = sets.at(-1)!;
    for (const set of sets.slice(0, -1)) {
      expect(set.restSeconds).toBeLessThanOrEqual(working.restSeconds);
    }
  });
});

describe('estimateDuration', () => {
  it('grows with the number of sets', () => {
    const short = generateWarmup({ ...options, workingWeight: 35, workingReps: 5 });
    const long = generateWarmup({ ...options, workingWeight: 180, workingReps: 5 });
    expect(estimateDuration(long)).toBeGreaterThan(estimateDuration(short));
  });

  it('is zero for an empty ramp', () => {
    expect(estimateDuration([])).toBe(0);
  });
});
