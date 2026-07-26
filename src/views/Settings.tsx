/**
 * Settings and data control.
 *
 * Because everything lives on the device, the user needs a real way to move it:
 * export produces a plain JSON file, and import validates every record before
 * accepting it. Deletion is genuinely complete and gated behind a confirmation.
 */

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/state/useApp';
import { Segmented } from '@/components/ui/Segmented';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { exportData, importData, MAX_IMPORT_BYTES } from '@/lib/storage';
import type { Unit } from '@/lib/units';
import type { Locale } from '@/lib/i18n';

/** Minimal shape of the deferred install prompt; not in lib.dom yet. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const APP_VERSION = '1.0.0';

export function Settings() {
  const {
    t,
    settings,
    history,
    updateSettings,
    replaceSettings,
    replaceHistory,
    resetAll,
  } = useApp();

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Capture the install prompt so we can offer it from a real button rather than
  // relying on the browser's own, easily-missed affordance.
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    // The prompt is single-use; drop it either way.
    setInstallEvent(null);
  };

  const handleExport = () => {
    const bundle = exportData(settings, history);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `aldeafit-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    // Release the blob; otherwise it is pinned for the page's lifetime.
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Always clear the input so re-picking the same file fires `change` again.
    event.target.value = '';
    if (!file) return;

    // Check size before reading: never pull an arbitrarily large file into memory.
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage({ tone: 'error', text: t('settings.importError') });
      return;
    }

    try {
      const result = importData(await file.text());
      if (!result.ok || !result.settings || !result.history) {
        setMessage({ tone: 'error', text: t('settings.importError') });
        return;
      }

      replaceSettings(result.settings);
      replaceHistory(result.history);

      const text =
        result.skipped > 0
          ? `${t('settings.importOk', { n: result.history.length })} · ${t('settings.importSkipped', { n: result.skipped })}`
          : t('settings.importOk', { n: result.history.length });
      setMessage({ tone: 'ok', text });
    } catch {
      setMessage({ tone: 'error', text: t('settings.importError') });
    }
  };

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="space-y-5">
        {/* ---------- Preferences ---------- */}
        <section className="card space-y-5 p-5 sm:p-6">
          <Segmented
            label={t('settings.units')}
            value={settings.unit}
            onChange={(unit: Unit) => updateSettings({ unit })}
            options={[
              { value: 'kg', label: 'Kilogramos (kg)' },
              { value: 'lb', label: 'Pounds (lb)' },
            ]}
          />

          <Segmented
            label={t('settings.theme')}
            value={settings.theme}
            onChange={(theme: 'dark' | 'light' | 'system') => updateSettings({ theme })}
            options={[
              { value: 'dark', label: t('settings.theme.dark') },
              { value: 'light', label: t('settings.theme.light') },
              { value: 'system', label: t('settings.theme.system') },
            ]}
          />

          <Segmented
            label={t('settings.language')}
            value={settings.locale}
            onChange={(locale: Locale) => updateSettings({ locale })}
            options={[
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' },
            ]}
          />
        </section>

        {/* ---------- Install ---------- */}
        {installEvent && (
          <section className="card flex items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('settings.install')}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('settings.installHint')}
              </p>
            </div>
            <button
              type="button"
              onClick={install}
              className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
            >
              <Icon name="install" className="size-4" />
              {t('settings.install')}
            </button>
          </section>
        )}

        {/* ---------- Data ---------- */}
        <section className="card p-5 sm:p-6">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('settings.data')}
          </h2>

          {message && (
            <p
              role="status"
              className="mt-3 rounded-xl border px-3 py-2 text-xs"
              style={{
                borderColor:
                  message.tone === 'ok' ? 'var(--color-success-500)' : 'var(--color-danger-500)',
                color: message.tone === 'ok' ? 'var(--color-success-500)' : 'var(--color-danger-500)',
              }}
            >
              {message.text}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
            >
              <Icon name="download" className="size-4" />
              {t('settings.export')}
            </button>

            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]"
              style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
            >
              <Icon name="upload" className="size-4" />
              {t('settings.import')}
            </button>

            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--border-subtle)' }}>
            {confirmingClear ? (
              <div>
                <p className="mb-3 text-sm" style={{ color: 'var(--color-danger-500)' }}>
                  {t('settings.clearConfirm')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetAll();
                      // Also drop the persisted keys, not just in-memory state.
                      try {
                        localStorage.removeItem('aldeafit:settings');
                        localStorage.removeItem('aldeafit:history');
                        localStorage.removeItem('aldeafit:inventory');
                      } catch {
                        /* Storage unavailable; in-memory reset already happened. */
                      }
                      setConfirmingClear(false);
                      setMessage(null);
                    }}
                    className="rounded-xl px-4 py-2.5 text-sm font-bold"
                    style={{ backgroundColor: 'var(--color-danger-500)', color: '#fff' }}
                  >
                    {t('settings.clearConfirmYes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(false)}
                    className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
                    style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }}
                  >
                    {t('settings.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'var(--color-danger-500)' }}
              >
                <Icon name="trash" className="size-4" />
                {t('settings.clear')}
              </button>
            )}
          </div>
        </section>

        {/* ---------- Privacy ---------- */}
        <section className="card p-5 sm:p-6">
          <h2
            className="flex items-center gap-2 text-sm font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            <Icon name="shield" className="size-4" style={{ color: 'var(--color-success-500)' }} />
            {t('settings.privacy')}
          </h2>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('settings.privacyText')}
          </p>

          <p
            className="mt-4 border-t pt-4 text-[11px]"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            {t('app.name')} · {t('settings.version')} {APP_VERSION}
          </p>
        </section>
      </div>
    </div>
  );
}
