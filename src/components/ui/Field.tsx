/**
 * Numeric input with steppers.
 *
 * Built specifically for gym use: a large tap target, `inputMode="decimal"` so
 * phones show the number pad, and +/- buttons sized for a hand that just held a
 * barbell. The steppers are what make this usable one-handed between sets.
 */

import { useId, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown after the value, e.g. "kg" or "reps". */
  suffix?: string;
  error?: string | null;
  hint?: ReactNode;
  /** Step applied by the +/- buttons. */
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  autoFocus?: boolean;
  /** Hide the steppers for fields where they make no sense. */
  showSteppers?: boolean;
}

export function Field({
  label,
  value,
  onChange,
  suffix,
  error,
  hint,
  step = 1,
  min = 0,
  max = 9999,
  placeholder,
  autoFocus,
  showSteppers = true,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const nudge = (direction: 1 | -1) => {
    const current = Number(value.replace(',', '.'));
    const base = Number.isFinite(current) ? current : 0;
    const next = Math.min(max, Math.max(min, base + direction * step));
    // Trim float noise from steps like 0.1 without forcing decimals on integers.
    onChange(String(Math.round(next * 100) / 100));
  };

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold tracking-[0.14em] uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </label>

      <div
        className="flex items-stretch overflow-hidden rounded-2xl border transition-colors focus-within:border-[var(--accent)]"
        style={{
          backgroundColor: 'var(--surface-input)',
          borderColor: error ? 'var(--color-danger-500)' : 'var(--border-subtle)',
        }}
      >
        {showSteppers && (
          <button
            type="button"
            onClick={() => nudge(-1)}
            aria-label={`${label} −${step}`}
            className="px-4 text-2xl leading-none transition-colors hover:bg-[var(--surface-hover)] active:scale-95"
            style={{ color: 'var(--text-secondary)' }}
          >
            −
          </button>
        )}

        {/*
          The suffix is a flex sibling rather than an absolutely-positioned
          overlay. Overlaying it forced symmetric padding on the input, which
          clipped values like "102.5" once the field got narrow in a two-column
          layout — the number vanished while the result stayed correct.
        */}
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            /* `decimal` keeps the phone keypad numeric while still allowing the
               comma that a Spanish layout produces. */
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className="tabular w-full min-w-0 bg-transparent py-4 text-center text-2xl font-bold outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          {suffix && (
            <span
              className="pointer-events-none shrink-0 text-sm font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              {suffix}
            </span>
          )}
        </div>

        {showSteppers && (
          <button
            type="button"
            onClick={() => nudge(1)}
            aria-label={`${label} +${step}`}
            className="px-4 text-2xl leading-none transition-colors hover:bg-[var(--surface-hover)] active:scale-95"
            style={{ color: 'var(--text-secondary)' }}
          >
            +
          </button>
        )}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium" style={{ color: 'var(--color-danger-500)' }}>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
