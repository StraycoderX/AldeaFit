/**
 * Strength standards.
 *
 * Answers "is this good?" — the question every calculator leaves hanging. Two
 * lenses: the beginner→elite ladder for the specific lift, and a DOTS score that
 * normalises for bodyweight so lifters of different sizes can be compared.
 */

import { useState } from 'react';
import { useApp } from '@/state/useApp';
import { Field } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Segmented';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  LIFTS,
  STRENGTH_LEVELS,
  assessStrength,
  dots,
  type LiftId,
  type Sex,
} from '@/lib/standards';
import { formatWeight, fromKg, round } from '@/lib/units';
import { LIMITS, parseWeight } from '@/lib/validation';
import type { TranslationKey } from '@/lib/i18n';

const LEVEL_COLOR: Record<string, string> = {
  beginner: 'var(--color-ink-400)',
  novice: 'var(--color-aqua-500)',
  intermediate: 'var(--color-volt-500)',
  advanced: 'var(--color-ember-500)',
  elite: 'var(--color-ember-400)',
};

export function Standards() {
  const { t, unit, settings, updateSettings, currentOneRm } = useApp();

  const [lift, setLift] = useState<LiftId>('bench');
  const [oneRm, setOneRm] = useState(() =>
    currentOneRm ? String(round(fromKg(currentOneRm, unit), 1)) : '',
  );
  const [bodyweight, setBodyweight] = useState(() =>
    String(round(fromKg(settings.bodyweightKg, unit), 1)),
  );

  // Re-seed both fields when their upstream source changes. Adjusting state
  // during render avoids the extra committed pass a syncing effect would cost.
  const source = `${currentOneRm ?? ''}|${settings.bodyweightKg}|${unit}`;
  const [lastSource, setLastSource] = useState(source);
  if (source !== lastSource) {
    setLastSource(source);
    if (currentOneRm !== null) setOneRm(String(round(fromKg(currentOneRm, unit), 1)));
    setBodyweight(String(round(fromKg(settings.bodyweightKg, unit), 1)));
  }

  const oneRmParsed = parseWeight(oneRm, unit);
  const bwParsed = parseWeight(bodyweight, unit);

  const oneRmKg = oneRmParsed.ok ? oneRmParsed.value : 0;
  const bodyweightKg = bwParsed.ok ? bwParsed.value : settings.bodyweightKg;

  const commitBodyweight = (value: string) => {
    setBodyweight(value);
    const parsed = parseWeight(value, unit);
    if (
      parsed.ok &&
      parsed.value >= LIMITS.bodyweightKg.min &&
      parsed.value <= LIMITS.bodyweightKg.max
    ) {
      updateSettings({ bodyweightKg: parsed.value });
    }
  };

  const ready = oneRmKg > 0 && bodyweightKg > 0;
  const assessment = ready ? assessStrength(oneRmKg, bodyweightKg, lift, settings.sex) : null;
  const dotsScore = ready ? dots(oneRmKg, bodyweightKg, settings.sex) : 0;

  return (
    <div>
      <PageHeader title={t('standards.title')} subtitle={t('standards.subtitle')} />

      <div className="card mb-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('pct.setOneRm')}
            value={oneRm}
            onChange={setOneRm}
            suffix={unit}
            step={unit === 'kg' ? 2.5 : 5}
            min={0}
            max={LIMITS.weightKg.max * (unit === 'kg' ? 1 : 2.2)}
          />
          <Field
            label={t('standards.bodyweight')}
            value={bodyweight}
            onChange={commitBodyweight}
            suffix={unit}
            step={unit === 'kg' ? 1 : 2}
            min={0}
            max={LIMITS.bodyweightKg.max * (unit === 'kg' ? 1 : 2.2)}
          />
        </div>

        {/* `min-w-0` keeps the six-option lift picker scrolling inside its own
            track instead of widening the page on a narrow phone. */}
        <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] [&>*]:min-w-0">
          <Segmented
            label={t('calc.lift')}
            size="sm"
            wrap
            value={lift}
            onChange={setLift}
            options={LIFTS.map((item) => ({
              value: item.id,
              label: t(`lift.${item.key}` as TranslationKey),
            }))}
          />
          <Segmented
            label={t('standards.sex')}
            size="sm"
            value={settings.sex}
            onChange={(sex: Sex) => updateSettings({ sex })}
            options={[
              { value: 'male', label: t('standards.sex.male') },
              { value: 'female', label: t('standards.sex.female') },
            ]}
          />
        </div>
      </div>

      {assessment ? (
        <div className="animate-rise grid gap-5 lg:grid-cols-2 lg:items-start">
          {/* ---------- Level ladder ---------- */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('standards.level')}
              </span>
              <span className="tabular text-sm" style={{ color: 'var(--text-secondary)' }}>
                {assessment.ratio}× {t('standards.bodyweight').toLowerCase()}
              </span>
            </div>

            <p
              className="display mt-1 text-4xl sm:text-5xl"
              style={{ color: LEVEL_COLOR[assessment.level] }}
            >
              {t(`standards.level.${assessment.level}` as TranslationKey)}
            </p>

            {/* Ladder: each rung is a level, filled to the lifter's position. */}
            <ul className="mt-6 space-y-2.5">
              {STRENGTH_LEVELS.map((level, index) => {
                const threshold = assessment.thresholds[index] ?? 0;
                const reached = assessment.ratio >= threshold;
                const isCurrent = level === assessment.level;

                return (
                  <li key={level} className="flex items-center gap-3">
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold"
                      style={
                        reached
                          ? {
                              backgroundColor: LEVEL_COLOR[level],
                              borderColor: 'transparent',
                              color: 'var(--color-ink-950)',
                            }
                          : { borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }
                      }
                    >
                      {reached ? '✓' : index + 1}
                    </span>

                    <span
                      className="flex-1 text-sm font-semibold"
                      style={{
                        color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {t(`standards.level.${level}` as TranslationKey)}
                    </span>

                    <span className="tabular text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatWeight(threshold * bodyweightKg, unit)} {unit}
                    </span>
                  </li>
                );
              })}
            </ul>

            {assessment.nextLevel && assessment.nextLevelKg !== null ? (
              <div
                className="mt-5 rounded-xl border p-4"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {t('standards.nextLevel')}:{' '}
                    {t(`standards.level.${assessment.nextLevel}` as TranslationKey)}
                  </span>
                  <span className="tabular text-xs font-bold" style={{ color: 'var(--accent)' }}>
                    {t('standards.toGo')}{' '}
                    {formatWeight(Math.max(0, assessment.nextLevelKg - oneRmKg), unit)} {unit}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--surface-input)' }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${assessment.progress * 100}%`,
                      backgroundColor: 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm font-semibold" style={{ color: 'var(--color-ember-400)' }}>
                {t('standards.maxLevel')}
              </p>
            )}
          </section>

          {/* ---------- DOTS ---------- */}
          <section className="card glow-accent hatch p-5 text-center sm:p-6">
            <p
              className="text-xs font-semibold tracking-[0.16em] uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('standards.dots')}
            </p>
            <p className="display tabular mt-2 text-7xl" style={{ color: 'var(--accent)' }}>
              {dotsScore}
            </p>
            <p className="mx-auto mt-3 max-w-xs text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('standards.dotsHelp')}
            </p>

            <p
              className="mt-6 border-t pt-4 text-[11px]"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              {t('standards.disclaimer')}
            </p>
          </section>
        </div>
      ) : (
        <p className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('calc.empty')}
        </p>
      )}
    </div>
  );
}
