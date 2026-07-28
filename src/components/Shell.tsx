/**
 * Application shell.
 *
 * The layout is genuinely different per form factor rather than one design
 * squeezed to fit:
 *  - Phone: a bottom tab bar within thumb reach, and a compact sticky header.
 *  - Tablet: an icon rail that keeps content width sane in landscape.
 *  - Desktop: a labelled sidebar plus a ⌘K command palette.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '@/state/useApp';
import type { TranslationKey } from '@/lib/i18n';
import { Logo } from './Logo';
import { Icon, type IconName } from './ui/Icon';

export type ViewId =
  | 'calculator'
  | 'percentages'
  | 'plates'
  | 'warmup'
  | 'technique'
  | 'standards'
  | 'history'
  | 'settings';

export interface NavItem {
  id: ViewId;
  labelKey: TranslationKey;
  icon: IconName;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'calculator', labelKey: 'nav.calculator', icon: 'calculator' },
  { id: 'percentages', labelKey: 'nav.percentages', icon: 'percent' },
  { id: 'plates', labelKey: 'nav.plates', icon: 'barbell' },
  { id: 'warmup', labelKey: 'nav.warmup', icon: 'flame' },
  { id: 'technique', labelKey: 'nav.technique', icon: 'body' },
  { id: 'standards', labelKey: 'nav.standards', icon: 'trophy' },
  { id: 'history', labelKey: 'nav.history', icon: 'chart' },
  { id: 'settings', labelKey: 'nav.settings', icon: 'settings' },
] as const;

/** Items that fit in the phone tab bar; the rest live behind "more". */
const PRIMARY_MOBILE: readonly ViewId[] = ['calculator', 'plates', 'warmup', 'history'];

interface ShellProps {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  onOpenPalette: () => void;
  children: ReactNode;
}

export function Shell({ view, onNavigate, onOpenPalette, children }: ShellProps) {
  const { t } = useApp();
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const online = () => setOffline(false);
    const goneOffline = () => setOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', goneOffline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', goneOffline);
    };
  }, []);

  // Navigating always dismisses the mobile overflow sheet.
  const go = (next: ViewId) => {
    setMoreOpen(false);
    onNavigate(next);
  };

  const overflowItems = NAV_ITEMS.filter((item) => !PRIMARY_MOBILE.includes(item.id));
  const overflowActive = overflowItems.some((item) => item.id === view);

  return (
    <div className="min-h-dvh" style={{ backgroundColor: 'var(--surface-base)' }}>
      <a
        href="#main"
        className="sr-only rounded-lg px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
      >
        {t('common.skipToContent')}
      </a>

      {offline && (
        <div
          role="status"
          className="px-4 py-1.5 text-center text-xs font-semibold"
          style={{ backgroundColor: 'var(--color-aqua-600)', color: '#04212b' }}
        >
          {t('common.offline')}
        </div>
      )}

      <div className="lg:flex">
        {/* ---------- Desktop sidebar ---------- */}
        <aside
          className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r px-4 py-6 lg:flex"
          style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="mb-8 px-2">
            <Logo />
          </div>

          <nav className="flex flex-col gap-1" aria-label={t('common.menu')}>
            {NAV_ITEMS.map((item) => {
              const active = item.id === view;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={
                    active
                      ? { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  <Icon name={item.icon} className="size-[18px]" />
                  {t(item.labelKey)}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onOpenPalette}
            className="mt-auto flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors hover:bg-[var(--surface-hover)]"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            <span className="flex items-center gap-2">
              <Icon name="search" className="size-4" />
              {t('common.search')}
            </span>
            <kbd
              className="rounded border px-1.5 py-0.5 font-mono text-[10px]"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              ⌘K
            </kbd>
          </button>
        </aside>

        {/* ---------- Tablet icon rail ---------- */}
        <aside
          className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center border-r py-6 md:flex lg:hidden"
          style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="mb-8">
            <Logo compact />
          </div>
          <nav className="flex flex-col gap-2" aria-label={t('common.menu')}>
            {NAV_ITEMS.map((item) => {
              const active = item.id === view;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={t(item.labelKey)}
                  title={t(item.labelKey)}
                  className="grid size-11 place-items-center rounded-xl transition-all duration-200"
                  style={
                    active
                      ? { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  <Icon name={item.icon} className="size-5" />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ---------- Content ---------- */}
        <div className="min-w-0 flex-1">
          {/* Mobile header */}
          <header
            className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur-xl md:hidden"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--surface-base) 85%, transparent)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Logo />
            <button
              type="button"
              onClick={onOpenPalette}
              aria-label={t('common.search')}
              className="grid size-9 place-items-center rounded-lg border"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              <Icon name="search" className="size-4" />
            </button>
          </header>

          <main
            id="main"
            className="mx-auto w-full max-w-5xl px-4 pt-5 pb-28 sm:px-6 md:pt-8 md:pb-12 lg:px-10"
          >
            {children}
          </main>
        </div>
      </div>

      {/* ---------- Mobile tab bar ---------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-xl md:hidden"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--surface-raised) 92%, transparent)',
          borderColor: 'var(--border-subtle)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label={t('common.menu')}
      >
        <div className="grid grid-cols-5">
          {NAV_ITEMS.filter((item) => PRIMARY_MOBILE.includes(item.id)).map((item) => {
            const active = item.id === view;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center gap-1 py-2.5 transition-colors"
                style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                <Icon name={item.icon} className="size-[22px]" />
                <span className="text-[10px] font-semibold">{t(item.labelKey)}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            className="flex flex-col items-center gap-1 py-2.5 transition-colors"
            style={{ color: overflowActive || moreOpen ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <Icon name="more" className="size-[22px]" />
            <span className="text-[10px] font-semibold">{t('common.menu')}</span>
          </button>
        </div>
      </nav>

      {/* Mobile overflow sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            className="animate-rise absolute inset-x-0 bottom-0 rounded-t-3xl border-t p-4"
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderColor: 'var(--border-subtle)',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
            }}
          >
            <div
              className="mx-auto mb-4 h-1 w-10 rounded-full"
              style={{ backgroundColor: 'var(--border-strong)' }}
            />
            <div className="grid grid-cols-3 gap-2">
              {overflowItems.map((item) => {
                const active = item.id === view;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.id)}
                    className="flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-xs font-semibold"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-ink)',
                            borderColor: 'transparent',
                          }
                        : { color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }
                    }
                  >
                    <Icon name={item.icon} className="size-5" />
                    {t(item.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
