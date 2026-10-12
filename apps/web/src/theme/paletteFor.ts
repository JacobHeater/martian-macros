import type { ThemePreference } from '../domain/ThemePreference';
import type { Palette } from './Palette';

/**
 * The palette a preference means right now. "System" follows the phone's
 * light or dark appearance. Before the first choice is made the app is
 * Martian (MM-184).
 */
export function paletteFor(preference: ThemePreference, systemPrefersDark: boolean): Palette {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  if (preference === 'unselected') return 'martian';
  return preference;
}
