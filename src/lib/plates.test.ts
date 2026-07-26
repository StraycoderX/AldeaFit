import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLATES_KG,
  maxLoadable,
  smallestIncrement,
  solvePlates,
  type PlateSpec,
} from './plates';

/** A plate set with effectively unlimited stock, for pure-arithmetic cases. */
const UNLIMITED: PlateSpec[] = DEFAULT_PLATES_KG.map((p) => ({ ...p, count: 40 }));

describe('solvePlates', () => {
  it('returns an empty bar for the bar weight itself', () => {
    const solution = solvePlates(20, 20, UNLIMITED);
    expect(solution.plates).toHaveLength(0);
    expect(solution.achieved).toBe(20);
    expect(solution.exact).toBe(true);
  });

  it('loads a classic 100 kg as 2×20 per side', () => {
    const solution = solvePlates(100, 20, UNLIMITED);
    expect(solution.exact).toBe(true);
    expect(solution.achieved).toBe(100);
    expect(solution.plates).toEqual([
      expect.objectContaining({ weight: 25, perSide: 1 }),
      expect.objectContaining({ weight: 15, perSide: 1 }),
    ]);
  });

  it('always produces a symmetric, exactly achievable total', () => {
    // Every 2.5 kg step from the bar up should be exactly loadable.
    for (let target = 20; target <= 200; target += 2.5) {
      const solution = solvePlates(target, 20, UNLIMITED);
      expect(solution.exact).toBe(true);
      expect(solution.achieved).toBeCloseTo(target, 3);
    }
  });

  it('flags a target below the bar instead of returning negative plates', () => {
    const solution = solvePlates(10, 20, UNLIMITED);
    expect(solution.belowBar).toBe(true);
    expect(solution.plates).toHaveLength(0);
    expect(solution.achieved).toBe(20);
  });

  it('respects a finite inventory and reports the shortfall', () => {
    // Only one pair of 20s exists, so 100 kg is not reachable.
    const limited: PlateSpec[] = [{ weight: 20, count: 2, color: '#000000' }];
    const solution = solvePlates(100, 20, limited);
    expect(solution.exact).toBe(false);
    expect(solution.achieved).toBe(60);
    expect(solution.remainder).toBe(40);
  });

  it('ignores a plate it cannot pair', () => {
    // A single 25 cannot be loaded symmetrically.
    const odd: PlateSpec[] = [
      { weight: 25, count: 1, color: '#000000' },
      { weight: 10, count: 4, color: '#111111' },
    ];
    const solution = solvePlates(60, 20, odd);
    expect(solution.plates.some((p) => p.weight === 25)).toBe(false);
    expect(solution.achieved).toBe(60);
  });

  it('does not lose a plate to floating-point error', () => {
    // 62.5 needs a 1.25 per side on top of a 20 — a classic float trap.
    const solution = solvePlates(62.5, 20, UNLIMITED);
    expect(solution.exact).toBe(true);
    expect(solution.achieved).toBe(62.5);
  });

  it('orders plates heaviest first, as they load onto the sleeve', () => {
    const solution = solvePlates(147.5, 20, UNLIMITED);
    const weights = solution.plates.map((p) => p.weight);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  });
});

describe('smallestIncrement', () => {
  it('is twice the lightest pairable plate', () => {
    expect(smallestIncrement(UNLIMITED)).toBe(2.5);
  });

  it('falls back to 1 when nothing can be paired', () => {
    expect(smallestIncrement([{ weight: 20, count: 1, color: '#000000' }])).toBe(1);
  });
});

describe('maxLoadable', () => {
  it('sums every pairable plate onto the bar', () => {
    const inventory: PlateSpec[] = [
      { weight: 20, count: 4, color: '#000000' },
      { weight: 10, count: 2, color: '#111111' },
    ];
    // (2 pairs × 20 + 1 pair × 10) per side = 50 per side → 100 + bar.
    expect(maxLoadable(20, inventory)).toBe(120);
  });
});
