/**
 * AldeaFit wordmark.
 *
 * "Aldea" is a village — the brand idea is a training community, so the mark is
 * a cluster of three bars that read simultaneously as rooftops and as a rising
 * progress chart. Drawn as SVG so it stays sharp at any size and inherits the
 * theme's accent colour.
 */

interface LogoProps {
  /** Mark only, for the tablet rail. */
  compact?: boolean;
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 32 32"
        className="size-8 shrink-0"
        role="img"
        aria-label="AldeaFit"
      >
        <rect width="32" height="32" rx="9" fill="var(--accent)" />
        {/* Three ascending bars: village roofline and progression at once. */}
        <path
          d="M7 22.5 11 15l4 7.5"
          stroke="var(--accent-ink)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M14.5 22.5 19 12l4.5 10.5"
          stroke="var(--accent-ink)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.55"
        />
        <rect x="6" y="24" width="20" height="2.4" rx="1.2" fill="var(--accent-ink)" />
      </svg>

      {!compact && (
        <span className="display text-xl" style={{ color: 'var(--text-primary)' }}>
          Aldea<span style={{ color: 'var(--accent)' }}>Fit</span>
        </span>
      )}
    </div>
  );
}
