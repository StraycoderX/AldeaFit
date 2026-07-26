/**
 * Barbell visualiser.
 *
 * Draws the loaded bar as inline SVG. This is the feature that turns an abstract
 * number into an instruction you can act on at the rack, so it is drawn as a
 * complete, symmetric barbell — the shape a lifter actually recognises — rather
 * than a half-bar diagram that needs explaining. Vector, so plate sizes stay
 * proportional and it stays crisp at any density.
 */

import type { PlateSolution } from '@/lib/plates';

interface BarbellProps {
  solution: PlateSolution;
  /** Heaviest plate in the inventory, used to scale plate sizes consistently. */
  maxPlateWeight: number;
  unit: string;
}

/** Plate diameter as a fraction of the tallest, floored so 1.25s stay visible. */
function heightFactor(weight: number, max: number): number {
  if (max <= 0) return 1;
  return Math.min(1, Math.max(0.38, 0.38 + 0.62 * (weight / max)));
}

/** Plate thickness scales with mass, clamped to keep the stack readable. */
function thickness(weight: number, max: number): number {
  if (max <= 0) return 9;
  return Math.min(14, Math.max(4.5, 4.5 + (weight / max) * 9.5));
}

const VIEW_W = 400;
const VIEW_H = 150;
const CY = VIEW_H / 2;
const MAX_PLATE_H = 116;

/** Inner edge of each sleeve — plates load outward from here. */
const COLLAR_R = 262;
const COLLAR_L = VIEW_W - COLLAR_R;

export function Barbell({ solution, maxPlateWeight, unit }: BarbellProps) {
  // Flatten the per-side solution into individual plates, heaviest first, which
  // is also the order they go onto the sleeve.
  const sequence = solution.plates.flatMap((plate) =>
    Array.from({ length: plate.perSide }, () => ({ weight: plate.weight, color: plate.color })),
  );

  // Compress spacing if an unusually long stack would run off the sleeve.
  const naturalWidth = sequence.reduce(
    (sum, p) => sum + thickness(p.weight, maxPlateWeight) + 1.5,
    0,
  );
  const available = VIEW_W - COLLAR_R - 14;
  const scale = naturalWidth > available ? available / naturalWidth : 1;

  // Lay the right-hand stack out once; the left is its mirror image.
  const layout = sequence.reduce<{ x: number; w: number; h: number; color: string }[]>(
    (acc, plate) => {
      const previous = acc[acc.length - 1];
      const w = thickness(plate.weight, maxPlateWeight) * scale;
      acc.push({
        x: previous ? previous.x + previous.w + 1.5 * scale : COLLAR_R,
        w,
        h: MAX_PLATE_H * heightFactor(plate.weight, maxPlateWeight),
        color: plate.color,
      });
      return acc;
    },
    [],
  );

  const label =
    sequence.length === 0
      ? `${solution.achieved} ${unit}`
      : `${solution.achieved} ${unit}: ${solution.plates
          .map((p) => `${p.perSide} × ${p.weight} ${unit}`)
          .join(', ')} ${unit === 'kg' ? 'por lado' : 'per side'}`;

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-auto w-full" role="img" aria-label={label}>
      {/* Sleeves (the thick ends the plates sit on) */}
      <rect x="14" y={CY - 8} width={COLLAR_L - 8} height="16" rx="4" fill="var(--color-ink-500)" />
      <rect
        x={COLLAR_R + 8}
        y={CY - 8}
        width={VIEW_W - COLLAR_R - 22}
        height="16"
        rx="4"
        fill="var(--color-ink-500)"
      />

      {/* Shaft */}
      <rect x={COLLAR_L} y={CY - 5} width={COLLAR_R - COLLAR_L} height="10" rx="3" fill="var(--color-ink-400)" />
      {/* Knurl marks, purely to make the shaft read as a bar */}
      <rect x={COLLAR_L + 26} y={CY - 5} width="42" height="10" fill="var(--color-ink-500)" />
      <rect x={COLLAR_R - 68} y={CY - 5} width="42" height="10" fill="var(--color-ink-500)" />

      {/* Collars */}
      <rect x={COLLAR_L - 10} y={CY - 14} width="10" height="28" rx="2.5" fill="var(--color-ink-300)" />
      <rect x={COLLAR_R} y={CY - 14} width="10" height="28" rx="2.5" fill="var(--color-ink-300)" />

      {/* Plates, mirrored about the centre line */}
      {layout.map((plate, index) => (
        <g key={index}>
          {/* Right side */}
          <rect
            x={plate.x + 10}
            y={CY - plate.h / 2}
            width={plate.w}
            height={plate.h}
            rx={Math.min(2.5, plate.w / 2)}
            fill={plate.color}
            stroke="rgb(0 0 0 / 0.5)"
            strokeWidth="0.75"
          />
          <rect
            x={plate.x + 10}
            y={CY - plate.h / 2}
            width={plate.w}
            height={Math.min(7, plate.h * 0.11)}
            rx={Math.min(2.5, plate.w / 2)}
            fill="rgb(255 255 255 / 0.2)"
          />

          {/* Left side */}
          <rect
            x={VIEW_W - plate.x - plate.w - 10}
            y={CY - plate.h / 2}
            width={plate.w}
            height={plate.h}
            rx={Math.min(2.5, plate.w / 2)}
            fill={plate.color}
            stroke="rgb(0 0 0 / 0.5)"
            strokeWidth="0.75"
          />
          <rect
            x={VIEW_W - plate.x - plate.w - 10}
            y={CY - plate.h / 2}
            width={plate.w}
            height={Math.min(7, plate.h * 0.11)}
            rx={Math.min(2.5, plate.w / 2)}
            fill="rgb(255 255 255 / 0.2)"
          />
        </g>
      ))}
    </svg>
  );
}
