/**
 * Warm-up ramp.
 *
 * Turns a working weight into the sets that lead up to it, each with its own
 * plate loading and rest interval. The ramp adapts to how heavy the session is,
 * so a 60 kg squat day doesn't get the same five-step build-up as a 180 kg one.
 */

import { useMemo, useState } from 'react';
import { useApp } from '@/state/useApp';
import { Field } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { estimateDuration, generateWarmup } from '@/lib/warmup';
import { smallestIncrement } from '@/lib/plates';
import { fromKg, round } from '@/lib/units';
import { LIMITS, parseNumber, parseReps } from '@/lib/validation';

/** "3 min 30 s" reads better than 210 seconds. */
function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function Warmup() {
  const { t, unit, plates, currentOneRm, settings } = useApp();

  const barDisplay = round(fromKg(settings.barKg, unit), 2);

  // Default to 80% of the known 1RM — a realistic top working set.
  const [working, setWorking] = useState(() =>
    currentOneRm ? String(round(fromKg(currentOneRm, unit) * 0.8, 1)) : '',
  );
  const [reps, setReps] = useState('5');

  // Adopt a newly calculated 1RM only while the user has not typed their own
  // working weight, so their entry is never overwritten underneath them.
  const source = `${currentOneRm ?? ''}|${unit}`;
  const [lastSource, setLastSource] = useState(source);
  if (source !== lastSource) {
    setLastSource(source);
    if (currentOneRm !== null && working === '') {
      setWorking(String(round(fromKg(currentOneRm, unit) * 0.8, 1)));
    }
  }

  const workingParsed = parseNumber(working, { min: 0, max: 2000 });
  const repsParsed = parseReps(reps);

  const sets = useMemo(() => {
    if (!workingParsed.ok || !repsParsed.ok) return [];
    return generateWarmup({
      workingWeight: workingParsed.value,
      workingReps: repsParsed.value,
      bar: barDisplay,
      inventory: plates,
      increment: smallestIncrement(plates),
    });
  }, [workingParsed.ok, workingParsed.value, repsParsed.ok, repsParsed.value, barDisplay, plates]);

  const duration = estimateDuration(sets);

  return (
    <div>
      <PageHeader title={t('warmup.title')} subtitle={t('warmup.subtitle')} />

      <div className="card mb-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:max-w-md sm:grid-cols-2">
          <Field
            label={t('warmup.working')}
            value={working}
            onChange={setWorking}
            suffix={unit}
            step={unit === 'kg' ? 2.5 : 5}
            min={0}
            max={2000}
            autoFocus
          />
          <Field
            label={t('warmup.workingReps')}
            value={reps}
            onChange={setReps}
            step={1}
            min={LIMITS.reps.min}
            max={LIMITS.reps.max}
          />
        </div>
      </div>

      {sets.length > 0 ? (
        <>
          <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('warmup.duration')}: <strong>{formatDuration(duration)}</strong>
          </p>

          <ol className="animate-rise space-y-2.5">
            {sets.map((set) => {
              const plateSummary =
                set.plates.plates.length === 0
                  ? t('warmup.barOnly')
                  : set.plates.plates.map((p) => `${p.perSide}×${p.weight}`).join(' · ');

              return (
                <li
                  key={set.index}
                  className="card flex items-center gap-4 p-4"
                  style={
                    set.isWorkingSet
                      ? {
                          borderColor: 'var(--accent)',
                          backgroundColor: 'color-mix(in srgb, var(--accent) 8%, var(--surface-card))',
                        }
                      : undefined
                  }
                >
                  {/* Set number / percentage badge */}
                  <div
                    className="grid size-12 shrink-0 place-items-center rounded-xl text-sm font-bold"
                    style={
                      set.isWorkingSet
                        ? { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }
                        : { backgroundColor: 'var(--surface-input)', color: 'var(--text-secondary)' }
                    }
                  >
                    {set.percent === 0 ? (
                      <Icon name="barbell" className="size-5" />
                    ) : (
                      <span className="tabular">{set.percent}%</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2">
                      <span
                        className="tabular text-2xl font-bold"
                        style={{ color: set.isWorkingSet ? 'var(--accent)' : 'var(--text-primary)' }}
                      >
                        {set.weight}
                      </span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        {unit}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        × {set.reps}
                      </span>
                    </p>
                    <p className="tabular mt-0.5 truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                      {plateSummary}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {set.isWorkingSet ? (
                      <span
                        className="text-[11px] font-bold tracking-wider uppercase"
                        style={{ color: 'var(--accent)' }}
                      >
                        {t('warmup.workingSet')}
                      </span>
                    ) : (
                      <span className="tabular text-xs" style={{ color: 'var(--text-muted)' }}>
                        {t('warmup.rest')} {set.restSeconds}s
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <p className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('calc.empty')}
        </p>
      )}
    </div>
  );
}
