import { describe, expect, it } from 'vitest';
import { formatWeight, fromKg, round, roundToIncrement, toKg } from './units';

describe('unit conversion', () => {
  it('round-trips kg → lb → kg without drift', () => {
    for (const kg of [1, 20, 62.5, 100, 227.5]) {
      expect(toKg(fromKg(kg, 'lb'), 'lb')).toBeCloseTo(kg, 9);
    }
  });

  it('uses the exact international pound', () => {
    expect(fromKg(100, 'lb')).toBeCloseTo(220.462, 3);
  });

  it('is an identity for kg', () => {
    expect(fromKg(100, 'kg')).toBe(100);
    expect(toKg(100, 'kg')).toBe(100);
  });
});

describe('round', () => {
  it('rounds half away from zero rather than to even', () => {
    expect(round(2.675, 2)).toBe(2.68);
    expect(round(1.005, 2)).toBe(1.01);
  });

  it('returns 0 for non-finite input instead of NaN', () => {
    expect(round(Number.NaN)).toBe(0);
    expect(round(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('roundToIncrement', () => {
  it('snaps to the nearest step', () => {
    expect(roundToIncrement(101, 2.5)).toBe(100);
    expect(roundToIncrement(101.5, 2.5)).toBe(102.5);
  });

  it('passes the value through for a non-positive increment', () => {
    expect(roundToIncrement(101, 0)).toBe(101);
  });
});

describe('formatWeight', () => {
  it('drops a trailing .0 on whole numbers', () => {
    expect(formatWeight(100, 'kg')).toBe('100');
  });

  it('keeps one decimal when it carries information', () => {
    expect(formatWeight(102.5, 'kg')).toBe('102.5');
  });
});
