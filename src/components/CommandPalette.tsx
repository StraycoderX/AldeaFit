/**
 * Command palette (⌘K / Ctrl+K).
 *
 * A desktop affordance the reference has no equivalent of: keyboard users can
 * jump anywhere without touching the mouse. It also doubles as the mobile search
 * button's target, so the same code serves both.
 *
 * Focus is trapped while open and restored on close, and the dialog is labelled
 * so screen readers announce it correctly.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/state/useApp';
import { NAV_ITEMS, type ViewId } from './Shell';
import { Icon } from './ui/Icon';

interface CommandPaletteProps {
  onClose: () => void;
  onNavigate: (view: ViewId) => void;
}

/** Case- and accent-insensitive match, so "calculo" finds "Cálculo". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Rendered only while open — the parent mounts and unmounts it. That keeps the
 * "reset on open" behaviour in `useState` initialisers instead of an effect
 * that would fire a second render every time the dialog appears.
 */
export function CommandPalette({ onClose, onNavigate }: CommandPaletteProps) {
  const { t } = useApp();
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const results = useMemo(() => {
    const items = NAV_ITEMS.map((item) => ({ ...item, label: t(item.labelKey) }));
    if (query.trim() === '') return items;
    const needle = normalize(query.trim());
    return items.filter((item) => normalize(item.label).includes(needle));
  }, [query, t]);

  // Derive rather than store: as the list shrinks the highlight clamps itself,
  // so there is no state to keep in sync.
  const activeIndex = Math.min(highlighted, Math.max(results.length - 1, 0));

  // Take focus on mount and restore it on unmount.
  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;

    // Wait a frame so the input is in the document before focusing it.
    const frame = requestAnimationFrame(() => inputRef.current?.focus());

    // Prevent the page behind the dialog from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, []);

  const choose = (view: ViewId) => {
    onNavigate(view);
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % Math.max(results.length, 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index) => (index - 1 + results.length) % Math.max(results.length, 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) choose(item.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('palette.title')}
        onKeyDown={onKeyDown}
        className="animate-pop relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl"
        style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border-strong)' }}
      >
        <div
          className="flex items-center gap-3 border-b px-4 py-3.5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <Icon name="search" className="size-4 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('palette.placeholder')}
            aria-label={t('palette.placeholder')}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd
            className="rounded border px-1.5 py-0.5 font-mono text-[10px]"
            style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
          >
            esc
          </kbd>
        </div>

        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label={t('palette.title')}>
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('palette.empty')}
            </li>
          )}

          {results.map((item, index) => {
            const active = index === activeIndex;
            return (
              <li key={item.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => choose(item.id)}
                  onMouseEnter={() => setHighlighted(index)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium"
                  style={
                    active
                      ? { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  <Icon name={item.icon} className="size-4" />
                  {item.label}
                  {active && (
                    <span className="ml-auto text-[10px] opacity-70">↵ {t('palette.hint')}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
