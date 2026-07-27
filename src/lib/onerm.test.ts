import { describe, expect, it } from 'vitest';
import {
  CLASSICAL_FORMULAS,
  estimateOneRm,
  estimateOneRmFromRir,
  gymDataOneRm,
  percentOfOneRm,
  repsForPercent,
  weightForReps,
} from './onerm';

describe('gymDataOneRm', () => {
  it('returns the load itself for a single rep', () => {
    expect(gymDataOneRm(100, 1)).toBe(100);
  });

  it('is the property the classical formulas lack: the multiplier depends on the load', () => {
    // Same rep count, very different loads. Every classical formula returns an
    // identical ratio here; this model must not.
    const lightRatio = gymDataOneRm(20, 5) / 20;
    const heavyRatio = gymDataOneRm(200, 5) / 200;

    expect(lightRatio).not.toBeCloseTo(heavyRatio, 2);
    // Lighter loads fatigue faster, so a 5-rep set sits further below the max.
    expect(lightRatio).toBeGreaterThan(heavyRatio);

    for (const formula of CLASSICAL_FORMULAS) {
      expect(formula.oneRm(20, 5) / 20).toBeCloseTo(formula.oneRm(200, 5) / 200, 9);
    }
  });

  it('matches published bench-press loading anchors', () => {
    // These pin the unit the equation is applied in. Feeding it kilograms
    // instead of pounds shifts every value by several percent and breaks this.
    const oneRm = 100;
    const anchors: [percent: number, expectedReps: number][] = [
      [95, 2.5],
      [90, 4],
      [85, 6],
      [80, 8.5],
      [70, 12.5],
    ];

    for (const [percent, expected] of anchors) {
      const reps = repsForPercent(percent, oneRm);
      expect(Math.abs(reps - expected)).toBeLessThanOrEqual(1.5);
    }
  });

  it('increases monotonically with reps', () => {
    const values = [1, 3, 5, 8, 12, 20].map((r) => gymDataOneRm(100, r));
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
  });

  it('increases monotonically with load at fixed reps', () => {
    const values = [20, 60, 100, 200, 400].map((w) => gymDataOneRm(w, 5));
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
  });

  it('stays bounded near the domain edge where the raw equation blows up', () => {
    // k(w) crosses zero around 1.75 lb. Without the floor, a 5-rep set at 2 lb
    // already implies a 6x multiplier and it diverges from there.
    for (const weight of [0.1, 0.5, 1, 2, 5, 10]) {
      for (const reps of [1, 5, 12, 20]) {
        const value = gymDataOneRm(weight, reps);
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(weight);
        expect(value).toBeLessThan(weight * 4);
      }
    }
  });

  it('returns 0 for a non-positive load rather than NaN', () => {
    expect(gymDataOneRm(0, 5)).toBe(0);
    expect(gymDataOneRm(-10, 5)).toBe(0);
  });
});

describe('estimateOneRm', () => {
  it('returns the load itself for a single rep', () => {
    const result = estimateOneRm(100, 1);
    expect(result.estimate).toBe(100);
    expect(result.low).toBe(100);
    expect(result.high).toBe(100);
    expect(result.spreadPercent).toBe(0);
  });

  it('reproduces the reference site exactly for Epley', () => {
    // The calculator this app improves on computes `kg * reps * 30/1000 + kg`.
    const epley = CLASSICAL_FORMULAS.find((f) => f.id === 'epley');
    expect(epley).toBeDefined();
    expect(Math.round(epley!.oneRm(100, 5) * 10) / 10).toBe(116.7);
  });

  it('leads with the gym-data model', () => {
    const result = estimateOneRm(102.5, 5);
    expect(result.estimates[0]?.id).toBe('gymdata');
    expect(result.estimates[0]?.weightDependent).toBe(true);
    expect(result.estimate).toBe(result.estimates[0]?.value);
  });

  it('places the estimate inside the reported band', () => {
    for (const [w, r] of [[60, 8], [102.5, 5], [200, 3], [40, 12]] as const) {
      const result = estimateOneRm(w, r);
      expect(result.low).toBeLessThanOrEqual(result.estimate);
      expect(result.estimate).toBeLessThanOrEqual(result.high);
    }
  });

  it('excludes formulas past their usable rep range', () => {
    const result = estimateOneRm(100, 20);
    expect(result.estimates.find((e) => e.id === 'brzycki')?.applicable).toBe(false);
    expect(result.estimates.find((e) => e.id === 'epley')?.applicable).toBe(true);
  });

  it('never produces a negative or infinite estimate at any rep count', () => {
    for (let reps = 1; reps <= 30; reps += 1) {
      const result = estimateOneRm(100, reps);
      expect(Number.isFinite(result.estimate)).toBe(true);
      expect(result.estimate).toBeGreaterThan(0);
      for (const estimate of result.estimates) {
        expect(Number.isFinite(estimate.value)).toBe(true);
        expect(estimate.value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('reports high confidence for low reps and low for high reps', () => {
    expect(estimateOneRm(100, 3).confidence).toBe('high');
    expect(estimateOneRm(100, 20).confidence).toBe('low');
  });
});

describe('estimateOneRmFromRir', () => {
  it('treats reps-plus-RIR as a set taken to failure', () => {
    expect(estimateOneRmFromRir(100, 5, 2).estimate).toBe(estimateOneRm(100, 7).estimate);
  });

  it('is identical to the plain estimate at 0 RIR', () => {
    expect(estimateOneRmFromRir(100, 5, 0).estimate).toBe(estimateOneRm(100, 5).estimate);
  });
});

describe('weightForReps', () => {
  it('inverts the model to within rounding', () => {
    for (const oneRm of [60, 100, 180, 250]) {
      for (const reps of [2, 5, 8, 12]) {
        const load = weightForReps(oneRm, reps);
        expect(gymDataOneRm(load, reps)).toBeCloseTo(oneRm, 0);
      }
    }
  });

  it('round-trips a 1RM back to itself at one rep', () => {
    expect(weightForReps(150, 1)).toBe(150);
  });

  it('prescribes a lighter load as reps increase', () => {
    expect(weightForReps(100, 10)).toBeLessThan(weightForReps(100, 5));
  });

  it('returns 0 for a non-positive 1RM', () => {
    expect(weightForReps(0, 5)).toBe(0);
  });
});

describe('percentOfOneRm', () => {
  it('is 100% at one rep', () => {
    expect(percentOfOneRm(1, 100)).toBe(100);
  });

  it('decreases as reps rise', () => {
    const values = [1, 3, 5, 8, 12].map((r) => percentOfOneRm(r, 100));
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeLessThan(values[i - 1]!);
    }
  });

  it('differs between a light and a heavy lifter — the classical tables could not', () => {
    // A 5-rep set is a different fraction of a 50 kg max than of a 250 kg max.
    expect(percentOfOneRm(5, 50)).not.toBeCloseTo(percentOfOneRm(5, 250), 1);
  });

  it('lands near the textbook 5RM value of roughly 85%', () => {
    const percent = percentOfOneRm(5, 100);
    expect(percent).toBeGreaterThan(82);
    expect(percent).toBeLessThan(92);
  });
});

describe('repsForPercent', () => {
  it('inverts percentOfOneRm to within a rep', () => {
    for (const reps of [2, 4, 6, 8, 10]) {
      const percent = percentOfOneRm(reps, 120);
      expect(Math.abs(repsForPercent(percent, 120) - reps)).toBeLessThanOrEqual(1);
    }
  });

  it('returns a single rep at or above 100%', () => {
    expect(repsForPercent(100, 100)).toBe(1);
    expect(repsForPercent(105, 100)).toBe(1);
  });
});
