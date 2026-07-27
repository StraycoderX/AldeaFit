/**
 * Percentage table.
 *
 * Maps every 5% band of a 1RM onto a load, the reps it should allow, and the
 * training zone it belongs to. The plate solution for each row is shown inline,
 * so the table answers "what do I put on the bar" and not just "what number".
 */

import { useState } from 'react';
import { useApp } from '@/state/useApp';
import { Field } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { repsForPercent } from '@/lib/onerm';
import { solvePlates } from '@/lib/plates';
import { formatWeight, fromKg, round } from '@/lib/units';
import { LIMITS, parseWeight } from '@/lib/validation';
import type { TranslationKey } from '@/lib/i18n';

/** Descending bands, the way a programme is usually written. */
const PERCENTS = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40] as const;

type Zone = 'max' | 'strength' | 'hypertrophy' | 'endurance';

function zoneFor(percent: number): Zone {
  if (percent >= 90) return 'max';
  if (percent >= 80) return 'strength';
  if (percent >= 65) return 'hypertrophy';
  return 'endurance';
}

const ZONE_COLOR: Record<Zone, string> = {
  max: 'var(--color-ember-500)',
  strength: 'var(--color-volt-500)',
  hypertrophy: 'var(--color-aqua-500)',
  endurance: 'var(--color-ink-400)',
};

export function Percentages() {
  const { t, unit, currentOneRm, plates, settings } = useApp();

  // Seed from the calculator when available, so the two screens stay in sync.
  const [input, setInput] = useState(() =>
    currentOneRm ? String(round(fromKg(currentOneRm, unit), 1)) : '',
  );

  // Re-seed when the calculated 1RM or the unit changes, while still letting the
  // user type their own value in between. Adjusting state during render is
  // React's documented alternative to a syncing effect: it re-renders
  // immediately without the extra committed pass an effect would cost.
  const source = `${currentOneRm ?? ''}|${unit}`;
  const [lastSource, setLastSource] = useState(source);
  if (source !== lastSource) {
    setLastSource(source);
    if (currentOneRm !== null) setInput(String(round(fromKg(currentOneRm, unit), 1)));
  }

  const parsed = parseWeight(input, unit);
  const oneRmKg = parsed.ok ? parsed.value : 0;

  const barDisplay = round(fromKg(settings.barKg, unit), 2);

  return (
    <div>
      <PageHeader title={t('pct.title')} subtitle={t('pct.subtitle')} />

      <div className="card mb-5 p-5">
        <div className="sm:max-w-xs">
          <Field
            label={t('pct.setOneRm')}
            value={input}
            onChange={setInput}
            suffix={unit}
            step={unit === 'kg' ? 2.5 : 5}
            min={0}
            max={LIMITS.weightKg.max * (unit === 'kg' ? 1 : 2.2)}
            placeholder="0"
          />
        </div>
      </div>

      {oneRmKg > 0 ? (
        <div className="card animate-rise overflow-hidden">
          {/* Header row is desktop-only; on phones each row is a self-labelling card. */}
          <div
            className="hidden border-b px-5 py-3 text-xs font-semibold tracking-wider uppercase sm:grid sm:grid-cols-[72px_minmax(0,1fr)_110px_minmax(0,1.2fr)] sm:gap-x-4"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            <span>{t('pct.percent')}</span>
            <span>{t('pct.weight')}</span>
            <span>{t('pct.reps')}</span>
            <span>{t('pct.loading')}</span>
          </div>

          <ul>
            {PERCENTS.map((percent) => {
              const weightKg = (oneRmKg * percent) / 100;
              const zone = zoneFor(percent);
              const displayWeight = fromKg(weightKg, unit);
              const solution = solvePlates(displayWeight, barDisplay, plates);

              const plateSummary =
                solution.belowBar || solution.plates.length === 0
                  ? t('plates.emptyBar')
                  : solution.plates.map((p) => `${p.perSide}×${p.weight}`).join(' · ');

              return (
                <li
                  key={percent}
                  className="grid grid-cols-2 items-center gap-x-3 gap-y-1 border-b px-5 py-3 last:border-b-0 sm:grid-cols-[72px_minmax(0,1fr)_110px_minmax(0,1.2fr)] sm:gap-x-4"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-6 w-1 rounded-full"
                      style={{ backgroundColor: ZONE_COLOR[zone] }}
                      aria-hidden="true"
                    />
                    <span
                      className="tabular text-sm font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {percent}%
                    </span>
                  </span>

                  <span
                    className="tabular text-right text-lg font-bold sm:text-left"
                    style={{ color: percent >= 90 ? 'var(--accent)' : 'var(--text-primary)' }}
                  >
                    {formatWeight(weightKg, unit)}
                    <span className="ml-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {unit}
                    </span>
                  </span>

                  <span className="tabular text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="sm:hidden">{t('pct.reps')}: </span>
                    {/* Rep counts are now derived from the lifter's own 1RM, so
                        this column shifts with the load rather than being a
                        fixed chart. The model is defined to 30 reps; beyond that
                        show an open-ended value instead of repeating "~30". */}
                    {percent >= 100
                      ? '1'
                      : repsForPercent(percent, oneRmKg) >= LIMITS.reps.max
                        ? `${LIMITS.reps.max}+`
                        : `~${repsForPercent(percent, oneRmKg)}`}
                  </span>

                  <span
                    className="tabular truncate text-right text-xs sm:text-left"
                    style={{ color: 'var(--text-muted)' }}
                    title={plateSummary}
                  >
                    {plateSummary}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Zone legend */}
          <div
            className="flex flex-wrap gap-x-4 gap-y-2 border-t px-5 py-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {(['max', 'strength', 'hypertrophy', 'endurance'] as const).map((zone) => (
              <span key={zone} className="flex items-center gap-1.5 text-[11px]">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: ZONE_COLOR[zone] }}
                  aria-hidden="true"
                />
                <span style={{ color: 'var(--text-muted)' }}>
                  {t(`pct.zone.${zone}` as TranslationKey)}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('calc.empty')}
        </p>
      )}
    </div>
  );
}
