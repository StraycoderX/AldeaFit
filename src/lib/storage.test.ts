import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  MAX_HISTORY_ENTRIES,
  MAX_IMPORT_BYTES,
  exportData,
  importData,
  loadHistory,
  loadSettings,
  saveHistory,
  saveSettings,
  type HistoryEntry,
} from './storage';

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'abc123',
    date: 1_700_000_000_000,
    lift: 'bench',
    label: '',
    weightKg: 100,
    reps: 5,
    rir: 0,
    oneRmKg: 116.7,
    ...overrides,
  };
}

describe('settings persistence', () => {
  it('round-trips settings', () => {
    const settings = { ...DEFAULT_SETTINGS, unit: 'lb' as const, locale: 'en' as const };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });

  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('survives corrupted JSON without throwing', () => {
    localStorage.setItem('aldeafit:settings', '{not valid json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('replaces out-of-range and unknown values with defaults', () => {
    localStorage.setItem(
      'aldeafit:settings',
      JSON.stringify({
        unit: 'stones',
        theme: 'neon',
        locale: 'fr',
        sex: 'other',
        bodyweightKg: 99999,
        barKg: -10,
      }),
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('history persistence', () => {
  it('round-trips entries newest first', () => {
    const older = entry({ id: 'old', date: 1000 });
    const newer = entry({ id: 'new', date: 2000 });
    saveHistory([older, newer]);
    expect(loadHistory().map((e) => e.id)).toEqual(['new', 'old']);
  });

  it('returns an empty list for a non-array payload', () => {
    localStorage.setItem('aldeafit:history', JSON.stringify({ not: 'an array' }));
    expect(loadHistory()).toEqual([]);
  });

  it('discards records missing the fields that give them meaning', () => {
    localStorage.setItem(
      'aldeafit:history',
      JSON.stringify([entry(), { id: 'junk' }, { weightKg: 'heavy', reps: 5, oneRmKg: 100 }]),
    );
    expect(loadHistory()).toHaveLength(1);
  });

  it('caps how many entries it will ever hold', () => {
    const many = Array.from({ length: MAX_HISTORY_ENTRIES + 50 }, (_, i) =>
      entry({ id: `id${i}`, date: 1000 + i }),
    );
    saveHistory(many);
    expect(loadHistory()).toHaveLength(MAX_HISTORY_ENTRIES);
  });
});

describe('importData', () => {
  it('accepts a bundle produced by exportData', () => {
    const bundle = exportData(DEFAULT_SETTINGS, [entry()]);
    const result = importData(JSON.stringify(bundle));
    expect(result.ok).toBe(true);
    expect(result.history).toHaveLength(1);
    expect(result.skipped).toBe(0);
  });

  it('rejects malformed JSON', () => {
    expect(importData('{oops').error).toBe('invalid-json');
  });

  it("rejects a file that isn't an AldeaFit bundle", () => {
    expect(importData(JSON.stringify({ app: 'someotherapp', history: [] })).error).toBe(
      'wrong-format',
    );
  });

  it('rejects an oversized file before parsing it', () => {
    const huge = 'x'.repeat(MAX_IMPORT_BYTES + 1);
    expect(importData(huge).error).toBe('too-large');
  });

  it('drops invalid records and reports how many were skipped', () => {
    const result = importData(
      JSON.stringify({
        app: 'aldeafit',
        version: 1,
        settings: DEFAULT_SETTINGS,
        history: [entry(), { garbage: true }, null, 42],
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.history).toHaveLength(1);
    expect(result.skipped).toBe(3);
  });

  it('truncates an over-long label rather than storing it whole', () => {
    const result = importData(
      JSON.stringify({
        app: 'aldeafit',
        settings: DEFAULT_SETTINGS,
        history: [entry({ lift: 'other', label: 'A'.repeat(5000) })],
      }),
    );
    expect(result.history?.[0]?.label.length).toBeLessThanOrEqual(120);
  });

  it('replaces an id that is not a safe token', () => {
    const result = importData(
      JSON.stringify({
        app: 'aldeafit',
        settings: DEFAULT_SETTINGS,
        history: [entry({ id: '<script>alert(1)</script>' })],
      }),
    );
    expect(result.history?.[0]?.id).not.toContain('<');
    expect(result.history?.[0]?.id).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  it('coerces an unknown lift to "other" rather than trusting it', () => {
    const result = importData(
      JSON.stringify({
        app: 'aldeafit',
        settings: DEFAULT_SETTINGS,
        history: [entry({ lift: 'javascript:alert(1)' as never })],
      }),
    );
    expect(result.history?.[0]?.lift).toBe('other');
  });

  it('caps the number of imported records', () => {
    const many = Array.from({ length: MAX_HISTORY_ENTRIES + 100 }, (_, i) =>
      entry({ id: `id${i}`, date: 1000 + i }),
    );
    const result = importData(
      JSON.stringify({ app: 'aldeafit', settings: DEFAULT_SETTINGS, history: many }),
    );
    expect(result.history!.length).toBeLessThanOrEqual(MAX_HISTORY_ENTRIES);
  });
});
