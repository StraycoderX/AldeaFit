/**
 * Technique screen.
 *
 * Pairs the animated 3D figure with the coaching cues for the selected lift.
 * Cues are numbered because they are genuinely sequential — setup precedes the
 * descent precedes the drive — not as decoration.
 */

import { useEffect, useState } from 'react';
import { useApp } from '@/state/useApp';
import { Segmented } from '@/components/ui/Segmented';
import { PageHeader } from '@/components/ui/PageHeader';
import { Figure3D } from '@/components/ui/Figure3D';
import { TECHNIQUES } from '@/lib/technique';
import { LIFTS, type LiftId } from '@/lib/standards';
import type { TranslationKey } from '@/lib/i18n';

export function Technique() {
  const { t } = useApp();
  const [lift, setLift] = useState<LiftId>('squat');

  // Honour the OS reduced-motion setting: hold the mid-rep pose instead of
  // looping. Read in the initialiser rather than an effect, so the first paint
  // is already correct and no second render is queued. Users who want the
  // movement anyway can still start it from the button.
  const [paused, setPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Follow the setting if it changes while the screen is open.
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setPaused(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const technique = TECHNIQUES[lift];
  const cues = Array.from({ length: technique.cueCount }, (_, index) => index + 1);

  return (
    <div>
      <PageHeader title={t('tech.title')} subtitle={t('tech.subtitle')} />

      <div className="mb-5">
        <Segmented
          label={t('calc.lift')}
          size="sm"
          wrap
          value={lift}
          onChange={setLift}
          options={LIFTS.filter((item) => item.id !== 'other').map((item) => ({
            value: item.id,
            label: t(`lift.${item.key}` as TranslationKey),
          }))}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {/* ---------- Figure ---------- */}
        <section className="card hatch relative overflow-hidden p-4 sm:p-5">
          <Figure3D
            technique={technique}
            paused={paused}
            className="h-[340px] w-full sm:h-[420px]"
            label={t('tech.figureLabel', { lift: t(`lift.${lift}` as TranslationKey) })}
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {t('tech.dragHint')}
            </p>
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
            >
              {paused ? t('tech.play') : t('tech.pause')}
            </button>
          </div>
        </section>

        {/* ---------- Cues ---------- */}
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('tech.cues')}
          </h2>

          <ol className="space-y-3">
            {cues.map((index) => (
              <li key={index} className="flex gap-3">
                <span
                  className="tabular grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
                >
                  {index}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {t(`tech.${lift}.cue${index}` as TranslationKey)}
                </p>
              </li>
            ))}
          </ol>

          <p
            className="mt-5 border-t pt-4 text-[11px] leading-relaxed"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            {t('tech.disclaimer')}
          </p>
        </section>
      </div>
    </div>
  );
}
