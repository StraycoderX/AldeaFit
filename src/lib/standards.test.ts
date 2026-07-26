import { describe, expect, it } from 'vitest';
import { assessStrength, dots } from './standards';

describe('dots', () => {
  it('is zero for non-positive input rather than NaN', () => {
    expect(dots(0, 80, 'male')).toBe(0);
    expect(dots(100, 0, 'male')).toBe(0);
  });

  it('produces a plausible score for a strong male lifter', () => {
    // 200 kg at 80 kg bodyweight is a serious single-lift number.
    const score = dots(200, 80, 'male');
    expect(score).toBeGreaterThan(100);
    expect(score).toBeLessThan(400);
  });

  it('rewards the lighter lifter for the same absolute load', () => {
    expect(dots(150, 70, 'male')).toBeGreaterThan(dots(150, 100, 'male'));
  });

  it('scales linearly with the lift at fixed bodyweight', () => {
    // Both sides are rounded to one decimal, so allow the 0.1 that costs.
    expect(dots(200, 80, 'male')).toBeCloseTo(dots(100, 80, 'male') * 2, 0);
  });

  it('stays finite outside the fitted bodyweight range', () => {
    // The polynomial turns over past its bounds; clamping must keep it sane.
    for (const bw of [20, 35, 250, 400]) {
      const score = dots(150, bw, 'male');
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeGreaterThan(0);
    }
  });
});

describe('assessStrength', () => {
  it('places a very light lift at beginner', () => {
    expect(assessStrength(20, 80, 'bench', 'male').level).toBe('beginner');
  });

  it('places a 2.25× bodyweight bench at elite', () => {
    const result = assessStrength(180, 80, 'bench', 'male');
    expect(result.level).toBe('elite');
    expect(result.nextLevel).toBeNull();
    expect(result.progress).toBe(1);
  });

  it('reports the load still needed for the next level', () => {
    const result = assessStrength(80, 80, 'bench', 'male');
    expect(result.nextLevel).not.toBeNull();
    expect(result.nextLevelKg).toBeGreaterThan(80);
  });

  it('keeps progress within 0 and 1', () => {
    for (const load of [10, 50, 80, 120, 200, 400]) {
      const { progress } = assessStrength(load, 80, 'squat', 'male');
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
  });

  it('uses different thresholds per sex', () => {
    const male = assessStrength(80, 70, 'bench', 'male');
    const female = assessStrength(80, 70, 'bench', 'female');
    // The same ratio is a higher relative achievement for a female lifter.
    expect(female.thresholds[0]).toBeLessThan(male.thresholds[0]!);
  });

  it('does not divide by zero at zero bodyweight', () => {
    const result = assessStrength(100, 0, 'bench', 'male');
    expect(Number.isFinite(result.ratio)).toBe(true);
    expect(result.ratio).toBe(0);
  });
});
