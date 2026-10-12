import { useEffect, useState } from 'react';
import { paletteFor } from '../theme/paletteFor';
import type { ThemePreference } from '../theme/ThemePreference';
import { HomeShell } from './HomeShell';
import { SettingsScreen } from './SettingsScreen';
import { usePrefersDark } from './usePrefersDark';

interface AppProps {
  /** Martian for a new installation (MM-184). */
  initialTheme?: ThemePreference;
}

/**
 * The app. The theme choice lives in memory until the data layer exists
 * (MM-228 part 3); nothing here is written to browser storage.
 */
export function App({ initialTheme = 'martian' }: AppProps) {
  const [theme, setTheme] = useState<ThemePreference>(initialTheme);
  const [inSettings, setInSettings] = useState(false);
  const palette = paletteFor(theme, usePrefersDark());

  useEffect(() => {
    document.documentElement.className = `theme-${palette}`;
  }, [palette]);

  return inSettings ? (
    <SettingsScreen theme={theme} onTheme={setTheme} onBack={() => setInSettings(false)} />
  ) : (
    <HomeShell onOpenSettings={() => setInSettings(true)} />
  );
}
