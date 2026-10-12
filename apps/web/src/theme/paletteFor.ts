import type { Palette } from './Palette';
import type { ThemePreference } from './ThemePreference';

/**
 * The palette a preference means right now. "System" follows the phone's
 * light or dark appearance; the others are themselves.
 */
export function paletteFor(preference: ThemePreference, systemPrefersDark: boolean): Palette {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}
