/**
 * Root component.
 *
 * Routing is hash-based rather than history-based. That keeps deep links working
 * on GitHub Pages and any other static host without a rewrite rule, and it means
 * the service worker only ever has one HTML document to cache.
 */

import { useCallback, useEffect, useState } from 'react';
import { Shell, NAV_ITEMS, type ViewId } from '@/components/Shell';
import { CommandPalette } from '@/components/CommandPalette';
import { Calculator } from '@/views/Calculator';
import { Percentages } from '@/views/Percentages';
import { Plates } from '@/views/Plates';
import { Warmup } from '@/views/Warmup';
import { Standards } from '@/views/Standards';
import { History } from '@/views/History';
import { Settings } from '@/views/Settings';

const DEFAULT_VIEW: ViewId = 'calculator';

/** Read a view id from the URL hash, ignoring anything unrecognised. */
function viewFromHash(): ViewId {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const match = NAV_ITEMS.find((item) => item.id === raw);
  return match ? match.id : DEFAULT_VIEW;
}

const VIEWS: Record<ViewId, () => React.ReactElement> = {
  calculator: Calculator,
  percentages: Percentages,
  plates: Plates,
  warmup: Warmup,
  standards: Standards,
  history: History,
  settings: Settings,
};

export function App() {
  const [view, setView] = useState<ViewId>(viewFromHash);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Keep state and URL in sync in both directions, so back/forward work.
  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: ViewId) => {
    window.location.hash = `/${next}`;
    setView(next);
    // Land at the top of the new screen rather than mid-scroll.
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ⌘K / Ctrl+K opens the palette from anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const Current = VIEWS[view];

  return (
    <>
      <Shell view={view} onNavigate={navigate} onOpenPalette={() => setPaletteOpen(true)}>
        <Current />
      </Shell>

      {/* Mounted only while open, so its state resets naturally each time. */}
      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} onNavigate={navigate} />
      )}
    </>
  );
}
