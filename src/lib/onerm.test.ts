import { describe, expect, it } from 'vitest';
import {
  FORMULAS,
  estimateOneRm,
  estimateOneRmFromRir,
  percentOfOneRm,
  repsForPercent,
  weightForReps,
} from './onerm';

describe('estimateOneRm', () => {
  it('returns the load itself for a single rep', () => {
    const result = estimateOneRm(100, 1);
    expect(result.consensus).toBe(100);
    expect(result.low).toBe(100);
    expect(result.high).toBe(100);
    expect(result.spreadPercent).toBe(0);
  });

  it('matches Epley on the reference calculator input', () => {
    // The site this app improves on computes `kg * reps * 30/1000 + kg`.
    // Epley must still reproduce it exactly: 100 kg × 5 → 116.7 kg.
    const epley = FORMULAS.find((f) => f.id === 'epley');
    expect(epley).toBeDefined();
    expect(Math.round(epley!.oneRm(100, 5) * 10) / 10).toBe(116.7);
  });

  it('places the consensus inside the low/high band', () => {
    const result = estimateOneRm(100, 8);
    expect(result.low).toBeLessThanOrEqual(result.consensus);
    expect(result.consensus).toBeLessThanOrEqual(result.high);
  });

  it('increases monotonically with reps at a fixed load', () => {
    const values = [1, 3, 5, 8, 10].map((reps) => estimateOneRm(100, reps).consensus);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
  });

  it('scales linearly with the load', () => {
    // Every formula is linear in weight, so doubling the load must double the 1RM.
    const single = estimateOneRm(50, 5).consensus;
    const double = estimateOneRm(100, 5).consensus;
    expect(double).toBeCloseTo(single * 2, 1);
  });

  it('excludes formulas past their usable rep range', () => {
    const result = estimateOneRm(100, 20);
    const brzycki = result.estimates.find((e) => e.id === 'brzycki');
    // Brzycki's denominator (37 - r) makes it unusable well before 20 reps.
    expect(brzycki?.applicable).toBe(false);

    const epley = result.estimates.find((e) => e.id === 'epley');
    expect(epley?.applicable).toBe(true);
  });

  it('never produces a negative or infinite estimate near an asymptote', () => {
    for (let reps = 1; reps <= 30; reps += 1) {
      const result = estimateOneRm(100, reps);
      expect(Number.isFinite(result.consensus)).toBe(true);
      expect(result.consensus).toBeGreaterThan(0);
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
  it('treats reps-plus-RIR as equivalent to a set taken to failure', () => {
    // 5 reps with 2 in reserve should predict the same 1RM as 7 to failure.
    expect(estimateOneRmFromRir(100, 5, 2).consensus).toBe(estimateOneRm(100, 7).consensus);
  });

  it('is identical to the plain estimate at 0 RIR', () => {
    expect(estimateOneRmFromRir(100, 5, 0).consensus).toBe(estimateOneRm(100, 5).consensus);
  });
});

describe('percentOfOneRm', () => {
  it('is 100% at one rep', () => {
    expect(percentOfOneRm(1)).toBe(100);
  });

  it('decreases as reps rise', () => {
    const values = [1, 3, 5, 8, 12].map(percentOfOneRm);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeLessThan(values[i - 1]!);
    }
  });

  it('lands near the textbook 5RM value of roughly 85%', () => {
    const percent = percentOfOneRm(5);
    expect(percent).toBeGreaterThan(82);
    expect(percent).toBeLessThan(90);
  });
});

describe('weightForReps and repsForPercent', () => {
  it('round-trips a 1RM back to itself at one rep', () => {
    expect(weightForReps(150, 1)).toBe(150);
  });

  it('prescribes a lighter load as reps increase', () => {
    expect(weightForReps(100, 10)).toBeLessThan(weightForReps(100, 5));
  });

  it('inverts percentOfOneRm to within a rep', () => {
    for (const reps of [2, 4, 6, 8, 10]) {
      const percent = percentOfOneRm(reps);
      expect(Math.abs(repsForPercent(percent) - reps)).toBeLessThanOrEqual(1);
    }
  });

  it('returns a single rep at or above 100%', () => {
    expect(repsForPercent(100)).toBe(1);
    expect(repsForPercent(105)).toBe(1);
  });
});
