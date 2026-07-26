/**
 * Plate loader.
 *
 * The practical centrepiece: enter a target and see the bar drawn with exactly
 * the plates to hang on it. Because it respects a finite, editable inventory, it
 * tells the truth in a home gym — "closest possible: 97.5, you're 2.5 short" —
 * instead of prescribing plates that do not exist.
 *
 * Everything here works in the *display* unit rather than canonical kilograms:
 * plates are physical objects labelled 20 or 45, and converting them would
 * produce nonsense like a "9.07 kg" plate.
 */

import { useState } from 'react';
import { useApp } from '@/state/useApp';
import { Field } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { Barbell } from '@/components/ui/Barbell';
import { Icon } from '@/components/ui/Icon';
import { defaultPlates, solvePlates, maxLoadable } from '@/lib/plates';
import { fromKg, round } from '@/lib/units';
import { LIMITS, parseNumber } from '@/lib/validation';

export function Plates() {
  const { t, unit, plates, setPlates, currentOneRm, settings, updateSettings } = useApp();

  const barDisplay = round(fromKg(settings.barKg, unit), 2);
  const [target, setTarget] = useState(() =>
    currentOneRm ? String(round(fromKg(currentOneRm, unit), 1)) : String(barDisplay),
  );
  const [bar, setBar] = useState(String(barDisplay));

  // Follow the stored bar weight when the unit changes underneath us. Adjusting
  // state during render avoids the extra committed pass an effect would cost.
  const source = `${settings.barKg}|${unit}`;
  const [lastSource, setLastSource] = useState(source);
  if (source !== lastSource) {
    setLastSource(source);
    setBar(String(round(fromKg(settings.barKg, unit), 2)));
  }

  const targetParsed = parseNumber(target, { min: 0, max: 2000 });
  const barParsed = parseNumber(bar, { min: 0, max: LIMITS.barKg.max * 2.3 });

  const targetValue = targetParsed.ok ? targetParsed.value : 0;
  const barValue = barParsed.ok ? barParsed.value : barDisplay;

  const solution = solvePlates(targetValue, barValue, plates);
  const heaviestPlate = plates.reduce((max, p) => Math.max(max, p.weight), 0);
  const ceiling = maxLoadable(barValue, plates);

  const updateCount = (weight: number, count: number) => {
    setPlates(
      plates.map((plate) =>
        plate.weight === weight ? { ...plate, count: Math.max(0, Math.min(40, count)) } : plate,
      ),
    );
  };

  const commitBar = (value: string) => {
    setBar(value);
    const parsed = parseNumber(value, { min: 0, max: LIMITS.barKg.max * 2.3 });
    if (!parsed.ok) return;
    // Persist canonically so the setting survives a unit switch.
    updateSettings({ barKg: unit === 'kg' ? parsed.value : parsed.value * 0.45359237 });
  };

  return (
    <div>
      <PageHeader title={t('plates.title')} subtitle={t('plates.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <section className="card p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('plates.target')}
              value={target}
              onChange={setTarget}
              suffix={unit}
              step={unit === 'kg' ? 2.5 : 5}
              min={0}
              max={2000}
              autoFocus
            />
            <Field
              label={t('plates.bar')}
              value={bar}
              onChange={commitBar}
              suffix={unit}
              step={unit === 'kg' ? 5 : 10}
              min={0}
              max={LIMITS.barKg.max * 2.3}
            />
          </div>

          {/* ---------- Visualiser ---------- */}
          <div
            className="mt-6 rounded-2xl border p-4"
            style={{ backgroundColor: 'var(--surface-input)', borderColor: 'var(--border-subtle)' }}
          >
            <Barbell solution={solution} maxPlateWeight={heaviestPlate} unit={unit} />

            <p className="mt-2 text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {t('plates.perSide')}
            </p>
          </div>

          {/* ---------- Read-out ---------- */}
          <div className="mt-5">
            {solution.belowBar ? (
              <p
                className="rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: 'var(--color-ember-500)', color: 'var(--color-ember-400)' }}
              >
                {t('plates.belowBar')}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                    {t('plates.total')}
                  </span>
                  <span className="tabular display text-4xl" style={{ color: 'var(--accent)' }}>
                    {round(solution.achieved, 2)}
                    <span className="ml-1 text-lg">{unit}</span>
                  </span>
                </div>

                <p
                  className="mt-2 text-sm font-semibold"
                  style={{
                    color: solution.exact ? 'var(--color-success-500)' : 'var(--color-ember-400)',
                  }}
                >
                  {solution.exact ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="check" className="size-4" />
                      {t('plates.exact')}
                    </span>
                  ) : (
                    <>
                      {t('plates.closest')} ·{' '}
                      {solution.remainder > 0
                        ? `${t('plates.off')} ${round(Math.abs(solution.remainder), 2)} ${unit}`
                        : `${t('plates.over')} ${round(Math.abs(solution.remainder), 2)} ${unit}`}
                    </>
                  )}
                </p>

                {solution.plates.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {solution.plates.map((plate) => (
                      <li
                        key={plate.weight}
                        className="flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-sm font-bold"
                        style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                      >
                        <span
                          className="size-5 rounded-full border"
                          style={{ backgroundColor: plate.color, borderColor: 'rgb(0 0 0 / 0.35)' }}
                          aria-hidden="true"
                        />
                        {plate.perSide} × {plate.weight}
                      </li>
                    ))}
                  </ul>
                )}

                {targetValue > ceiling && (
                  <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Max: {round(ceiling, 2)} {unit}
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* ---------- Inventory ---------- */}
        <section className="card p-5 sm:p-6">
          <div className="mb-1 flex items-start justify-between gap-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('plates.inventory')}
            </h2>
            <button
              type="button"
              onClick={() => setPlates(defaultPlates(unit))}
              className="text-xs font-semibold underline underline-offset-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('plates.reset')}
            </button>
          </div>
          <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('plates.inventoryHelp')}
          </p>

          <ul className="space-y-2">
            {plates.map((plate) => (
              <li
                key={plate.weight}
                className="flex items-center gap-3 rounded-xl border px-3 py-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <span
                  className="size-7 shrink-0 rounded-full border"
                  style={{ backgroundColor: plate.color, borderColor: 'rgb(0 0 0 / 0.35)' }}
                  aria-hidden="true"
                />
                <span
                  className="tabular w-16 text-sm font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {plate.weight} {unit}
                </span>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateCount(plate.weight, plate.count - 2)}
                    aria-label={`${plate.weight} ${unit} −2`}
                    className="grid size-8 place-items-center rounded-lg border text-lg leading-none"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    −
                  </button>
                  <span
                    className="tabular w-10 text-center text-sm font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {plate.count}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCount(plate.weight, plate.count + 2)}
                    aria-label={`${plate.weight} ${unit} +2`}
                    className="grid size-8 place-items-center rounded-lg border text-lg leading-none"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {t('plates.available')} · max {round(ceiling, 2)} {unit}
          </p>
        </section>
      </div>
    </div>
  );
}
