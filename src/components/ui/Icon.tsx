/**
 * Icon set.
 *
 * Hand-rolled inline SVG rather than an icon package: the app needs eleven
 * glyphs, and shipping them inline keeps the bundle free of a dependency and the
 * CSP free of an external font origin. All paths share a 24px grid and 1.75
 * stroke so they sit together evenly.
 */

export type IconName =
  | 'calculator'
  | 'percent'
  | 'barbell'
  | 'flame'
  | 'trophy'
  | 'chart'
  | 'settings'
  | 'search'
  | 'more'
  | 'check'
  | 'close'
  | 'share'
  | 'trash'
  | 'download'
  | 'upload'
  | 'install'
  | 'shield'
  | 'body';

const PATHS: Record<IconName, string> = {
  calculator:
    'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M9 7h6 M9 11h.01 M12 11h.01 M15 11h.01 M9 15h.01 M12 15h.01 M15 15h.01',
  percent: 'M19 5 5 19 M8.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z M20.5 15.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  barbell: 'M4 9v6 M7 7v10 M17 7v10 M20 9v6 M7 12h10',
  flame:
    'M12 22c3.87 0 7-2.9 7-6.5 0-2.4-1.2-4.3-2.6-6-.6 1.2-1.4 2-2.4 2.4.3-2.4-.6-5-3-7.9-.4 3-2 4.4-3.4 5.8C6 11.4 5 13.2 5 15.5 5 19.1 8.13 22 12 22Z',
  trophy:
    'M7 4h10v5a5 5 0 0 1-10 0V4Z M7 6H4.5a2.5 2.5 0 0 0 2.5 4.5 M17 6h2.5a2.5 2.5 0 0 1-2.5 4.5 M12 14v4 M9 21h6 M10 18h4',
  chart: 'M4 20V10 M10 20V4 M16 20v-6 M22 20H2',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9v0a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.47 1Z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.35-4.35',
  more: 'M5 12h.01 M12 12h.01 M19 12h.01',
  check: 'M20 6 9 17l-5-5',
  close: 'M18 6 6 18 M6 6l12 12',
  share: 'M12 3v13 M8 7l4-4 4 4 M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
  trash: 'M3 6h18 M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6',
  download: 'M12 3v12 M8 11l4 4 4-4 M5 21h14',
  upload: 'M12 15V3 M8 7l4-4 4 4 M5 21h14',
  install: 'M12 3v12 M8 11l4 4 4-4 M4 21h16a1 1 0 0 0 1-1v-3 M3 17v3a1 1 0 0 0 1 1',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z M9 12l2 2 4-4',
  body: 'M12 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M12 8v6 M8 10h8 M12 14l-3 8 M12 14l3 8',
};

interface IconProps {
  name: IconName;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, className = 'size-5', style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {/* Multi-subpath strings are split so each segment strokes independently. */}
      {PATHS[name].split(' M').map((segment, index) => (
        <path key={index} d={index === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}
