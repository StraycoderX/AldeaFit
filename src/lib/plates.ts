/**
 * Barbell plate loading.
 *
 * Turns "you should lift 87.5 kg" into "put these plates on the bar", which is
 * the step every other calculator leaves to the lifter. Handles a finite plate
 * inventory, so the answer stays honest in a garage gym that only owns two 20s.
 */

import { round, type Unit } from './units';

export interface PlateSpec {
  /** Mass of a single plate, in the gym's own unit. */
  weight: number;
  /** How many of this plate exist in total (both sides combined). */
  count: number;
  /** Brand colour used by the visualiser. */
  color: string;
}

/** IWF-style colours for metric plates — instantly readable to any lifter. */
export const DEFAULT_PLATES_KG: PlateSpec[] = [
  { weight: 25, count: 8, color: '#E4462B' },
  { weight: 20, count: 8, color: '#2E6FDB' },
  { weight: 15, count: 4, color: '#E4B62B' },
  { weight: 10, count: 4, color: '#2FA84F' },
  { weight: 5, count: 4, color: '#F2F2F2' },
  { weight: 2.5, count: 4, color: '#1B1D21' },
  { weight: 1.25, count: 4, color: '#9AA0A6' },
];

/** Typical American pound inventory. */
export const DEFAULT_PLATES_LB: PlateSpec[] = [
  { weight: 45, count: 8, color: '#2E6FDB' },
  { weight: 35, count: 4, color: '#E4B62B' },
  { weight: 25, count: 4, color: '#2FA84F' },
  { weight: 10, count: 6, color: '#1B1D21' },
  { weight: 5, count: 4, color: '#F2F2F2' },
  { weight: 2.5, count: 4, color: '#9AA0A6' },
];

export function defaultPlates(unit: Unit): PlateSpec[] {
  return unit === 'kg' ? DEFAULT_PLATES_KG : DEFAULT_PLATES_LB;
}

/** Standard bar mass in the gym's own unit. */
export function defaultBar(unit: Unit): number {
  return unit === 'kg' ? 20 : 45;
}

export interface LoadedPlate {
  weight: number;
  /** Plates on *one* side of the bar. */
  perSide: number;
  color: string;
}

export interface PlateSolution {
  /** Plates to load on each side, heaviest first (collar-inward order). */
  plates: LoadedPlate[];
  /** Total achievable weight including the bar. */
  achieved: number;
  /** Requested weight minus achieved. Non-zero when the bar can't be made exact. */
  remainder: number;
  /** True when `achieved` matches the request within half a gram. */
  exact: boolean;
  /** True when the request is below the bare bar. */
  belowBar: boolean;
}

/**
 * Solve the plate loading for a target weight.
 *
 * Greedy heaviest-first is optimal for the real plate sets people own (each
 * denomination divides the next one up), and it is also what a lifter does by
 * hand — so the answer matches their intuition instead of being technically
 * minimal but strange to load.
 *
 * All arguments are in the same unit; the caller is responsible for consistency.
 */
export function solvePlates(target: number, bar: number, inventory: PlateSpec[]): PlateSolution {
  if (target < bar) {
    return { plates: [], achieved: bar, remainder: round(target - bar, 3), exact: false, belowBar: true };
  }

  // Plates are loaded symmetrically, so we only ever solve for one side.
  let remainingPerSide = (target - bar) / 2;
  const plates: LoadedPlate[] = [];

  const sorted = [...inventory]
    .filter((p) => p.weight > 0 && p.count > 0)
    .sort((a, b) => b.weight - a.weight);

  for (const plate of sorted) {
    // A plate must be available in pairs to keep the bar balanced.
    const pairsAvailable = Math.floor(plate.count / 2);
    if (pairsAvailable === 0) continue;

    // The 1e-9 slack absorbs float error so 2.5 doesn't fail to fit in 2.4999999.
    const wanted = Math.floor((remainingPerSide + 1e-9) / plate.weight);
    const perSide = Math.min(wanted, pairsAvailable);

    if (perSide > 0) {
      plates.push({ weight: plate.weight, perSide, color: plate.color });
      remainingPerSide -= perSide * plate.weight;
    }
  }

  const loadedPerSide = plates.reduce((sum, p) => sum + p.weight * p.perSide, 0);
  const achieved = round(bar + loadedPerSide * 2, 3);
  const remainder = round(target - achieved, 3);

  return {
    plates,
    achieved,
    remainder,
    exact: Math.abs(remainder) < 0.0005,
    belowBar: false,
  };
}

/**
 * Smallest weight increment the inventory can produce, used to snap prescribed
 * loads onto something the lifter can actually build.
 */
export function smallestIncrement(inventory: PlateSpec[]): number {
  const usable = inventory.filter((p) => p.weight > 0 && p.count >= 2).map((p) => p.weight);
  if (usable.length === 0) return 1;
  return round(Math.min(...usable) * 2, 3);
}

/** Total weight loadable on the bar with the entire inventory. */
export function maxLoadable(bar: number, inventory: PlateSpec[]): number {
  const perSide = inventory.reduce(
    (sum, p) => sum + p.weight * Math.floor(p.count / 2),
    0,
  );
  return round(bar + perSide * 2, 3);
}
