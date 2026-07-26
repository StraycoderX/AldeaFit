/**
 * Error boundary.
 *
 * A render crash must not take the whole page to white — the user's saved data
 * is intact and they should be told so. Deliberately does not report anywhere:
 * there is no telemetry endpoint in this app, by design.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Console only. Nothing leaves the device.
    console.error('AldeaFit render error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    // Strings are hard-coded bilingual here: the boundary may have caught a
    // failure inside the provider that supplies translations.
    return (
      <div
        className="grid min-h-dvh place-items-center p-6 text-center"
        style={{ backgroundColor: 'var(--surface-base)', color: 'var(--text-primary)' }}
      >
        <div className="max-w-sm">
          <h1 className="display text-3xl">Algo ha fallado</h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            La aplicación ha encontrado un error inesperado. Tus datos guardados están intactos.
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Something went wrong. Your saved data is intact.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl px-5 py-3 text-sm font-bold"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }}
          >
            Recargar / Reload
          </button>
        </div>
      </div>
    );
  }
}
