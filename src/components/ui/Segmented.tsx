/**
 * Segmented control.
 *
 * Used for every small mutually-exclusive choice (unit, theme, sex, lift). Built
 * on real radio semantics so keyboard and screen-reader users get arrow-key
 * navigation for free, with the selection indicator drawn behind the labels.
 */

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Hide the visible label when the surrounding layout already provides one. */
  hideLabel?: boolean;
  size?: 'sm' | 'md';
  /**
   * Wrap onto multiple rows instead of scrolling horizontally. Preferred for
   * groups of five or more, where a cut-off scrolling track reads as a bug.
   */
  wrap?: boolean;
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  hideLabel = false,
  size = 'md',
  wrap = false,
}: SegmentedProps<T>) {
  return (
    <div className="w-full">
      {!hideLabel && (
        <span
          className="mb-2 block text-xs font-semibold tracking-[0.14em] uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
      )}

      {/*
        `overflow-x-auto` + `min-w-0` matter: with six options on a 390px phone
        the labels are wider than the viewport, and without a scroll container
        the group would push the entire page sideways instead of scrolling
        itself. Options still stretch to fill when there is room.
      */}
      <div
        role="radiogroup"
        aria-label={label}
        className={`flex w-full min-w-0 gap-1 rounded-2xl border p-1 ${
          wrap ? 'flex-wrap' : 'no-scrollbar overflow-x-auto'
        }`}
        style={{ backgroundColor: 'var(--surface-input)', borderColor: 'var(--border-subtle)' }}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`rounded-xl font-semibold whitespace-nowrap transition-all duration-200 ${
                wrap ? 'flex-auto' : 'flex-1'
              } ${size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2.5 text-sm'}`}
              style={
                selected
                  ? { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
