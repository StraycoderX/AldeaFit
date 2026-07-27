/**
 * 1RM calculator.
 *
 * The reference computes one Epley value and prints it. This screen instead
 * shows the consensus of seven formulas, the range they span, an explicit
 * confidence rating, and the full per-formula breakdown — so a lifter can see
 * that "your 1RM is 122.5 kg" is really "somewhere around 118-127 kg".
 *
 * Results recompute as you type; there is no submit button gate, because on a
 * phone between sets the fewer taps the better.
 */

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/state/useApp';
import { Field } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Segmented';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { estimateOneRm, estimateOneRmFromRir } from '@/lib/onerm';
import { LIFTS, type LiftId } from '@/lib/standards';
import { formatWeight, fromKg, round } from '@/lib/units';
import { isHighRepEstimate, LIMITS, parseReps, parseWeight } from '@/lib/validation';
import type { TranslationKey } from '@/lib/i18n';

const ERROR_KEYS: Record<string, TranslationKey> = {
  required: 'error.required',
  'not-a-number': 'error.notANumber',
  'too-low': 'error.tooLow',
  'too-high': 'error.tooHigh',
};

export function Calculator() {
  const { t, unit, settings, history, addHistoryEntry, setCurrentOneRm } = useApp();

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('5');
  const [rir, setRir] = useState('0');
  const [lift, setLift] = useState<LiftId>('bench');
  // Track *which* inputs were saved/copied rather than a bare boolean, so the
  // confirmation clears itself the moment anything changes — no effect needed.
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const [copiedFor, setCopiedFor] = useState<string | null>(null);

  const weightResult = parseWeight(weight, unit);
  const repsResult = parseReps(reps);
  const rirResult = parseReps(rir === '' ? '0' : rir);

  // Only surface an error once the user has actually typed something, so the
  // form doesn't greet them with red text.
  const weightError =
    weight !== '' && !weightResult.ok ? t(ERROR_KEYS[weightResult.issue ?? 'required']!) : null;
  const repsError =
    reps !== '' && !repsResult.ok ? t(ERROR_KEYS[repsResult.issue ?? 'required']!) : null;

  const ready = weightResult.ok && repsResult.ok;
  const rirValue = rirResult.ok ? Math.min(rirResult.value, LIMITS.rir.max) : 0;

  const result = useMemo(() => {
    if (!ready) return null;
    return rirValue > 0
      ? estimateOneRmFromRir(weightResult.value, repsResult.value, rirValue)
      : estimateOneRm(weightResult.value, repsResult.value);
  }, [ready, rirValue, weightResult.value, repsResult.value]);

  // Publish the result so the percentage, plate and warm-up screens can use it.
  useEffect(() => {
    setCurrentOneRm(result ? result.estimate : null);
  }, [result, setCurrentOneRm]);

  const signature = `${weight}|${reps}|${rir}|${lift}`;
  const saved = savedFor === signature;
  const copied = copiedFor === signature;

  const effectiveReps = repsResult.ok ? repsResult.value + rirValue : 0;
  const highRep = ready && isHighRepEstimate(effectiveReps);

  // A new record only counts against the same lift.
  const bestForLift = history
    .filter((entry) => entry.lift === lift)
    .reduce((best, entry) => Math.max(best, entry.oneRmKg), 0);
  const isPr = result !== null && bestForLift > 0 && result.estimate > bestForLift;

  const save = () => {
    if (!result) return;
    addHistoryEntry({
      lift,
      label: '',
      weightKg: round(weightResult.value, 2),
      reps: repsResult.value,
      rir: rirValue,
      oneRmKg: result.estimate,
    });
    setSavedFor(signature);
  };

  const share = async () => {
    if (!result) return;
    const text = `${t('app.name')} · ${t(`lift.${lift}` as TranslationKey)}: ${formatWeight(
      result.estimate,
      unit,
    )} ${unit} 1RM (${formatWeight(weightResult.value, unit)} ${unit} × ${repsResult.value})`;

    // Web Share where available (phones), clipboard everywhere else.
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopiedFor(signature);
    } catch {
      // The user dismissed the share sheet, or the clipboard was blocked.
      // Neither is an error worth interrupting them over.
    }
  };

  const confidenceColor = result
    ? { high: 'var(--color-success-500)', medium: 'var(--color-volt-500)', low: 'var(--color-ember-500)' }[
        result.confidence
      ]
    : 'var(--text-muted)';

  return (
    <div>
      <PageHeader title={t('calc.title')} subtitle={t('calc.subtitle')} />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        {/* ---------- Inputs ---------- */}
        <section className="card hatch min-w-0 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('calc.weight')}
              value={weight}
              onChange={setWeight}
              suffix={unit}
              step={unit === 'kg' ? 2.5 : 5}
              min={0}
              max={LIMITS.weightKg.max * (unit === 'kg' ? 1 : 2.2)}
              placeholder="0"
              error={weightError}
              autoFocus
            />
            <Field
              label={t('calc.reps')}
              value={reps}
              onChange={setReps}
              step={1}
              min={LIMITS.reps.min}
              max={LIMITS.reps.max}
              placeholder="5"
              error={repsError}
            />
          </div>

          <div className="mt-4">
            <Field
              label={`${t('calc.rir')} · ${t('common.optional')}`}
              value={rir}
              onChange={setRir}
              step={1}
              min={LIMITS.rir.min}
              max={LIMITS.rir.max}
              hint={t('calc.rirHelp')}
            />
          </div>

          <div className="mt-5">
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
          </div>

          {rirValue > 0 && ready && (
            <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('calc.effectiveReps')}:{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>{effectiveReps}</strong>
            </p>
          )}
        </section>

        {/* ---------- Result ---------- */}
        <section className="lg:sticky lg:top-6">
          {!result ? (
            <div
              className="card grid min-h-[280px] place-items-center p-8 text-center text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('calc.empty')}
            </div>
          ) : (
            <div className="animate-rise space-y-4">
              <div className="card glow-accent hatch relative overflow-hidden p-6 text-center sm:p-8">
                {isPr && (
                  <span
                    className="animate-pop mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase"
                    style={{ backgroundColor: 'var(--color-ember-500)', color: '#200a03' }}
                  >
                    <Icon name="trophy" className="size-3.5" />
                    {t('calc.newPr')}
                  </span>
                )}

                <p
                  className="text-xs font-semibold tracking-[0.16em] uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('calc.result')}
                </p>

                <p className="display tabular mt-2 text-7xl sm:text-8xl" style={{ color: 'var(--accent)' }}>
                  {formatWeight(result.estimate, unit)}
                  <span className="ml-2 text-3xl sm:text-4xl">{unit}</span>
                </p>

                <p className="tabular mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('calc.range')}{' '}
                  <strong>
                    {formatWeight(result.low, unit)}–{formatWeight(result.high, unit)} {unit}
                  </strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>(±{result.spreadPercent}%)</span>
                </p>

                <div
                  className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
                  style={{ borderColor: confidenceColor }}
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: confidenceColor }} />
                  <span className="text-xs font-semibold" style={{ color: confidenceColor }}>
                    {t('calc.confidence')}: {t(`calc.confidence.${result.confidence}` as TranslationKey)}
                  </span>
                </div>

                <p className="mx-auto mt-3 max-w-xs text-xs" style={{ color: 'var(--text-muted)' }}>
                  {t(`calc.confidenceHelp.${result.confidence}` as TranslationKey)}
                </p>

                {/* Names the model behind the headline number, so the figure is
                    attributable rather than an anonymous output. */}
                <p
                  className="mx-auto mt-4 max-w-sm border-t pt-3 text-[11px] leading-relaxed"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                >
                  <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {t('calc.primaryBadge')}
                  </span>
                  {' · '}
                  {t('calc.primaryHelp')}
                </p>

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saved}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-transform active:scale-[0.98] disabled:opacity-60"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
                  >
                    <Icon name={saved ? 'check' : 'download'} className="size-4" />
                    {saved ? t('calc.saved') : t('calc.save')}
                  </button>
                  <button
                    type="button"
                    onClick={share}
                    aria-label={t('calc.share')}
                    className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]"
                    style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
                  >
                    <Icon name={copied ? 'check' : 'share'} className="size-4" />
                    <span className="hidden sm:inline">{copied ? t('calc.copied') : t('calc.share')}</span>
                  </button>
                </div>
              </div>

              {highRep && (
                <p
                  className="rounded-xl border px-4 py-3 text-xs"
                  style={{
                    borderColor: 'var(--color-ember-500)',
                    color: 'var(--color-ember-400)',
                  }}
                >
                  {t('calc.highRepWarning')}
                </p>
              )}

            </div>
          )}
        </section>
      </div>

      {/* ---------- Per-formula breakdown ----------
          Full width below the fold: on desktop this fills what would otherwise
          be a column of dead space beside the inputs, and it reads better as a
          wide two-column list than as a narrow stack. */}
      {result && (
        <div className="card animate-rise mt-5 p-5 sm:p-6">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('calc.breakdown')}
          </h2>
          <p className="mt-1 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('calc.breakdownHelp')}
          </p>

          <p
            className="mb-4 text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('calc.classicalLabel')}
          </p>

          <ul className="grid gap-2 lg:grid-cols-2 lg:gap-x-10">
                  {result.estimates.filter((e) => e.id !== 'gymdata').map((estimate) => {
                    // Scale across the low→high band rather than from zero. The
                    // formulas typically agree within a few percent, so a
                    // zero-based bar would render seven identical-looking rows
                    // and hide the very disagreement this panel exists to show.
                    const band = result.high - result.low;
                    const ratio =
                      band > 0 ? (estimate.value - result.low) / band : 1;
                    return (
                      <li key={estimate.id} className="flex items-center gap-3">
                        <span
                          className="w-20 shrink-0 text-xs font-semibold"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {estimate.name}
                        </span>

                        <div
                          className="h-2 flex-1 overflow-hidden rounded-full"
                          style={{ backgroundColor: 'var(--surface-input)' }}
                        >
                          {estimate.applicable && (
                            <div
                              className="h-full rounded-full transition-[width] duration-500"
                              style={{
                                // Floor at 12% so the lowest estimate still reads
                                // as a bar rather than an empty track.
                                width: `${12 + ratio * 88}%`,
                                backgroundColor:
                                  Math.abs(estimate.value - result.estimate) < 0.05
                                    ? 'var(--accent)'
                                    : 'var(--color-ink-500)',
                              }}
                            />
                          )}
                        </div>

                        <span
                          className="tabular w-20 shrink-0 text-right text-xs font-bold"
                          style={{
                            color: estimate.applicable ? 'var(--text-primary)' : 'var(--text-muted)',
                          }}
                        >
                          {estimate.applicable
                            ? `${round(fromKg(estimate.value, unit), 1)} ${unit}`
                            : t('calc.notApplicable')}
                        </span>
                      </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Keep the reference's bodyweight setting reachable without a detour. */}
      {settings.bodyweightKg > 0 && result && (
        <p className="mt-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('standards.ratio')}:{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>
            {round(result.estimate / settings.bodyweightKg, 2)}×
          </strong>{' '}
          {t('standards.bodyweight').toLowerCase()}
        </p>
      )}
    </div>
  );
}
