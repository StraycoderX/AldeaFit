/**
 * Application state.
 *
 * One context holds settings, history and the plate inventory. The app is small
 * enough that a reducer plus context beats pulling in a state library, and
 * keeping persistence inside the provider means no component has to remember to
 * write to `localStorage`.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  DEFAULT_SETTINGS,
  createId,
  loadHistory,
  loadSettings,
  saveHistory,
  saveSettings,
  type HistoryEntry,
  type Settings,
} from '@/lib/storage';
import { translate, type Locale, type TranslationKey } from '@/lib/i18n';
import { defaultPlates, type PlateSpec } from '@/lib/plates';
import type { Unit } from '@/lib/units';

interface State {
  settings: Settings;
  history: HistoryEntry[];
  /** Plate inventory, keyed by unit so switching units keeps both gyms' setups. */
  inventory: Record<Unit, PlateSpec[]>;
  /** Last calculated 1RM in kg, shared between screens. Null until first use. */
  currentOneRm: number | null;
}

type Action =
  | { type: 'settings/patch'; payload: Partial<Settings> }
  | { type: 'settings/replace'; payload: Settings }
  | { type: 'history/add'; payload: HistoryEntry }
  | { type: 'history/remove'; payload: string }
  | { type: 'history/replace'; payload: HistoryEntry[] }
  | { type: 'inventory/set'; payload: { unit: Unit; plates: PlateSpec[] } }
  | { type: 'oneRm/set'; payload: number | null }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'settings/patch':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'settings/replace':
      return { ...state, settings: action.payload };
    case 'history/add':
      return { ...state, history: [action.payload, ...state.history] };
    case 'history/remove':
      return { ...state, history: state.history.filter((e) => e.id !== action.payload) };
    case 'history/replace':
      return { ...state, history: action.payload };
    case 'inventory/set':
      return {
        ...state,
        inventory: { ...state.inventory, [action.payload.unit]: action.payload.plates },
      };
    case 'oneRm/set':
      return { ...state, currentOneRm: action.payload };
    case 'reset':
      return {
        settings: { ...DEFAULT_SETTINGS },
        history: [],
        inventory: { kg: defaultPlates('kg'), lb: defaultPlates('lb') },
        currentOneRm: null,
      };
    default:
      return state;
  }
}

/** Read the persisted inventory, falling back to sensible defaults per unit. */
function loadInventory(): Record<Unit, PlateSpec[]> {
  const fallback = { kg: defaultPlates('kg'), lb: defaultPlates('lb') };
  try {
    const raw = localStorage.getItem('aldeafit:inventory');
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return fallback;

    // Validate rather than cast: this value is as untrusted as any other key.
    const validate = (value: unknown, unit: Unit): PlateSpec[] => {
      if (!Array.isArray(value)) return defaultPlates(unit);
      const plates = value
        .filter((p): p is PlateSpec => {
          if (typeof p !== 'object' || p === null) return false;
          const candidate = p as Record<string, unknown>;
          return (
            typeof candidate.weight === 'number' &&
            Number.isFinite(candidate.weight) &&
            candidate.weight > 0 &&
            candidate.weight <= 100 &&
            typeof candidate.count === 'number' &&
            Number.isFinite(candidate.count) &&
            candidate.count >= 0 &&
            candidate.count <= 40 &&
            typeof candidate.color === 'string' &&
            // Only accept hex colours — this string is written into a style
            // attribute, so it must never carry arbitrary CSS.
            /^#[0-9a-fA-F]{6}$/.test(candidate.color)
          );
        })
        .slice(0, 20);
      return plates.length > 0 ? plates : defaultPlates(unit);
    };

    const record = parsed as Record<string, unknown>;
    return { kg: validate(record.kg, 'kg'), lb: validate(record.lb, 'lb') };
  } catch {
    return fallback;
  }
}

function init(): State {
  return {
    settings: loadSettings(),
    history: loadHistory(),
    inventory: loadInventory(),
    currentOneRm: null,
  };
}

export interface AppContextValue extends State {
  /** Translate a key in the active locale. */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  locale: Locale;
  unit: Unit;
  /** Plate inventory for the active unit. */
  plates: PlateSpec[];
  updateSettings: (patch: Partial<Settings>) => void;
  replaceSettings: (settings: Settings) => void;
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'date'>) => void;
  removeHistoryEntry: (id: string) => void;
  replaceHistory: (entries: HistoryEntry[]) => void;
  setPlates: (plates: PlateSpec[]) => void;
  setCurrentOneRm: (value: number | null) => void;
  resetAll: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // Persist on change. Each effect is scoped to its own slice so, for example,
  // typing in the calculator never rewrites the history key.
  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

  useEffect(() => {
    saveHistory(state.history);
  }, [state.history]);

  useEffect(() => {
    try {
      localStorage.setItem('aldeafit:inventory', JSON.stringify(state.inventory));
    } catch {
      /* Quota exceeded or storage disabled: keep running from memory. */
    }
  }, [state.inventory]);

  // Apply theme and language to the document root so CSS and assistive tech
  // both see the current state.
  useEffect(() => {
    const root = document.documentElement;
    const { theme, locale } = state.settings;

    const resolve = () =>
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : theme;

    root.dataset.theme = resolve();
    root.lang = locale;

    if (theme !== 'system') return;

    // Follow the OS while "system" is selected.
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      root.dataset.theme = resolve();
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [state.settings]);

  const { locale, unit } = { locale: state.settings.locale, unit: state.settings.unit };

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    dispatch({ type: 'settings/patch', payload: patch });
  }, []);

  const replaceSettings = useCallback((settings: Settings) => {
    dispatch({ type: 'settings/replace', payload: settings });
  }, []);

  const addHistoryEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'date'>) => {
    dispatch({
      type: 'history/add',
      payload: { ...entry, id: createId(), date: Date.now() },
    });
  }, []);

  const removeHistoryEntry = useCallback((id: string) => {
    dispatch({ type: 'history/remove', payload: id });
  }, []);

  const replaceHistory = useCallback((entries: HistoryEntry[]) => {
    dispatch({ type: 'history/replace', payload: entries });
  }, []);

  const setPlates = useCallback(
    (plates: PlateSpec[]) => {
      dispatch({ type: 'inventory/set', payload: { unit, plates } });
    },
    [unit],
  );

  const setCurrentOneRm = useCallback((value: number | null) => {
    dispatch({ type: 'oneRm/set', payload: value });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      t,
      locale,
      unit,
      plates: state.inventory[unit],
      updateSettings,
      replaceSettings,
      addHistoryEntry,
      removeHistoryEntry,
      replaceHistory,
      setPlates,
      setCurrentOneRm,
      resetAll,
    }),
    [
      state,
      t,
      locale,
      unit,
      updateSettings,
      replaceSettings,
      addHistoryEntry,
      removeHistoryEntry,
      replaceHistory,
      setPlates,
      setCurrentOneRm,
      resetAll,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
