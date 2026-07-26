import { describe, expect, it } from 'vitest';
import { LIMITS, isHighRepEstimate, parseNumber, parseReps, parseWeight } from './validation';

describe('parseNumber', () => {
  const bounds = { min: 1, max: 100 };

  it('accepts a plain decimal', () => {
    expect(parseNumber('42.5', bounds)).toEqual({ ok: true, value: 42.5 });
  });

  it('accepts a comma as the decimal separator', () => {
    // A Spanish numeric keypad emits a comma; "102,5" must not become 1025.
    expect(parseNumber('42,5', bounds)).toEqual({ ok: true, value: 42.5 });
  });

  it('rejects empty and nullish input', () => {
    expect(parseNumber('', bounds).issue).toBe('required');
    expect(parseNumber(null, bounds).issue).toBe('required');
    expect(parseNumber(undefined, bounds).issue).toBe('required');
  });

  it('rejects non-numeric text', () => {
    expect(parseNumber('abc', bounds).issue).toBe('not-a-number');
    expect(parseNumber('12abc', bounds).issue).toBe('not-a-number');
  });

  it('rejects the values that broke the reference calculator', () => {
    // `parseFloat` accepts all of these and yields Infinity or a wrong number.
    expect(parseNumber('Infinity', bounds).ok).toBe(false);
    expect(parseNumber('1e999', bounds).ok).toBe(false);
    expect(parseNumber('0x10', bounds).ok).toBe(false);
    expect(parseNumber('NaN', bounds).ok).toBe(false);
  });

  it('enforces both bounds', () => {
    expect(parseNumber('0.5', bounds).issue).toBe('too-low');
    expect(parseNumber('101', bounds).issue).toBe('too-high');
  });

  it('rounds when integer mode is requested', () => {
    expect(parseNumber('5.7', bounds, { integer: true }).value).toBe(6);
  });
});

describe('parseWeight', () => {
  it('returns kilograms unchanged for kg input', () => {
    expect(parseWeight('100', 'kg')).toEqual({ ok: true, value: 100 });
  });

  it('converts pound input to kilograms', () => {
    const result = parseWeight('225', 'lb');
    expect(result.ok).toBe(true);
    expect(result.value).toBeCloseTo(102.058, 2);
  });

  it('widens the accepted range for pounds so a valid lb load is not rejected', () => {
    // 1000 lb is ~453 kg — within the 600 kg cap, so it must be accepted.
    expect(parseWeight('1000', 'lb').ok).toBe(true);
  });

  it('rejects a negative load', () => {
    expect(parseWeight('-50', 'kg').ok).toBe(false);
  });
});

describe('parseReps', () => {
  it('accepts the usable range', () => {
    expect(parseReps('1').ok).toBe(true);
    expect(parseReps(String(LIMITS.reps.max)).ok).toBe(true);
  });

  it('rejects zero and absurd rep counts', () => {
    expect(parseReps('0').ok).toBe(false);
    expect(parseReps('500').ok).toBe(false);
  });
});

describe('isHighRepEstimate', () => {
  it('flags only sets past the reliable threshold', () => {
    expect(isHighRepEstimate(10)).toBe(false);
    expect(isHighRepEstimate(12)).toBe(false);
    expect(isHighRepEstimate(13)).toBe(true);
  });
});
