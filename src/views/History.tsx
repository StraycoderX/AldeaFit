/**
 * Progress history.
 *
 * A calculator you can't track is a toy. Saved estimates are charted over time
 * per lift, so the number becomes a trend. The chart is hand-drawn SVG — a
 * charting library would be many times the size of this entire app.
 */

import { useMemo, useState } from 'react';
import { useApp } from '@/state/useApp';
import { Segmented } from '@/components/ui/Segmented';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { LIFTS, type LiftId } from '@/lib/standards';
import { formatWeight, fromKg, round } from '@/lib/units';
import type { TranslationKey } from '@/lib/i18n';
import type { HistoryEntry } from '@/lib/storage';
import type { Unit } from '@/lib/units';

type Filter = LiftId | 'all';

interface ChartProps {
  entries: HistoryEntry[];
  unit: Unit;
  label: string;
}

/**
 * Sparkline of estimated 1RM over time.
 *
 * Points are spaced by index rather than by date: sessions are the meaningful
 * axis here, and real logging is irregular enough that a true time axis would
 * bunch everything against one edge.
 */
function Chart({ entries, unit, label }: ChartProps) {
  const W = 600;
  const H = 180;
  const PAD = { top: 16, right: 12, bottom: 24, left: 40 };

  // Oldest → newest for drawing.
  const points = [...entries].sort((a, b) => a.date - b.date);
  if (points.length < 2) return null;

  const values = points.map((entry) => fromKg(entry.oneRmKg, unit));
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Pad the domain so a flat line doesn't sit on the axis, and never divide by 0.
  const span = max - min || Math.max(max * 0.1, 1);
  const domainMin = min - span * 0.15;
  const domainMax = max + span * 0.15;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (index: number) =>
    PAD.left + (points.length === 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
  const y = (value: number) =>
    PAD.top + plotH - ((value - domainMin) / (domainMax - domainMin)) * plotH;

  const line = values.map((value, index) => `${x(index)},${round(y(value), 2)}`).join(' ');
  const area = `${PAD.left},${PAD.top + plotH} ${line} ${x(points.length - 1)},${PAD.top + plotH}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Horizontal guides with value labels. */}
      {[0, 0.5, 1].map((fraction) => {
        const value = domainMax - fraction * (domainMax - domainMin);
        const yPos = PAD.top + fraction * plotH;
        return (
          <g key={fraction}>
            <line
              x1={PAD.left}
              y1={yPos}
              x2={W - PAD.right}
              y2={yPos}
              stroke="var(--border-subtle)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <text
              x={PAD.left - 6}
              y={yPos + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-muted)"
            >
              {Math.round(value)}
            </text>
          </g>
        );
      })}

      <polyline points={area} fill="url(#chartFill)" stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {values.map((value, index) => (
        <circle
          key={points[index]?.id ?? index}
          cx={x(index)}
          cy={y(value)}
          r={index === values.length - 1 ? 5 : 3}
          fill="var(--accent)"
          stroke="var(--surface-card)"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

export function History() {
  const { t, unit, locale, history, removeHistoryEntry } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? history : history.filter((entry) => entry.lift === filter)),
    [history, filter],
  );

  const best = filtered.reduce((max, entry) => Math.max(max, entry.oneRmKg), 0);

  // Percentage change from the oldest to the newest record in view.
  const change = useMemo(() => {
    if (filtered.length < 2) return null;
    const sorted = [...filtered].sort((a, b) => a.date - b.date);
    const first = sorted[0]?.oneRmKg ?? 0;
    const last = sorted[sorted.length - 1]?.oneRmKg ?? 0;
    if (first <= 0) return null;
    return round(((last - first) / first) * 100, 1);
  }, [filtered]);

  const dateFormatter = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (history.length === 0) {
    return (
      <div>
        <PageHeader title={t('history.title')} subtitle={t('history.subtitle')} />
        <div className="card p-10 text-center">
          <Icon name="chart" className="mx-auto size-8" />
          <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('history.empty')}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('history.emptyHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('history.title')} subtitle={t('history.subtitle')} />

      <div className="mb-5">
        <Segmented
          label={t('history.filter')}
          size="sm"
          wrap
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all' as const, label: t('history.all') },
            ...LIFTS.map((item) => ({
              value: item.id,
              label: t(`lift.${item.key}` as TranslationKey),
            })),
          ]}
        />
      </div>

      {/* ---------- Summary ---------- */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
            {t('history.best')}
          </p>
          <p className="tabular mt-1 text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            {best > 0 ? `${formatWeight(best, unit)} ${unit}` : '—'}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
            {t('history.entries')}
          </p>
          <p className="tabular mt-1 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {filtered.length}
          </p>
        </div>

        <div className="card col-span-2 p-4 sm:col-span-1">
          <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
            {t('history.change')}
          </p>
          <p
            className="tabular mt-1 text-2xl font-bold"
            style={{
              color:
                change === null
                  ? 'var(--text-muted)'
                  : change >= 0
                    ? 'var(--color-success-500)'
                    : 'var(--color-danger-500)',
            }}
          >
            {change === null ? '—' : `${change > 0 ? '+' : ''}${change}%`}
          </p>
        </div>
      </div>

      {/* ---------- Chart ---------- */}
      {filtered.length >= 2 && (
        <div className="card mb-5 p-5">
          <p className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('history.chartLabel')}
          </p>
          <Chart entries={filtered} unit={unit} label={t('history.chartLabel')} />
        </div>
      )}

      {/* ---------- Entries ---------- */}
      <ul className="space-y-2">
        {filtered.map((entry) => {
          const isBest = entry.oneRmKg === best;
          return (
            <li key={entry.id} className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="tabular text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatWeight(entry.oneRmKg, unit)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {unit}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {t(`lift.${entry.lift}` as TranslationKey)}
                  </span>
                  {isBest && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
                    >
                      {t('history.best')}
                    </span>
                  )}
                </p>
                <p className="tabular mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatWeight(entry.weightKg, unit)} {unit} × {entry.reps}
                  {entry.rir > 0 && ` @${entry.rir} RIR`} · {dateFormatter.format(new Date(entry.date))}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeHistoryEntry(entry.id)}
                aria-label={`${t('history.delete')} ${formatWeight(entry.oneRmKg, unit)} ${unit}`}
                className="grid size-9 shrink-0 place-items-center rounded-lg border transition-colors hover:border-[var(--color-danger-500)] hover:text-[var(--color-danger-500)]"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                <Icon name="trash" className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
