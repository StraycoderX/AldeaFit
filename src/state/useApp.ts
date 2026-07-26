import { useContext } from 'react';
import { AppContext, type AppContextValue } from './AppContext';

/** Access app state. Throws when used outside the provider, which is a bug. */
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return context;
}
