import type { Watched } from '../../lang/Watched';
import type { ThemePreference } from '../ThemePreference';

/** Reads the user's device-level display preferences. */
export interface PreferencesReader {
  /**
   * The current preference, then each change. Fresh installs return
   * `unselected` until the first-launch choice is confirmed.
   */
  watchThemePreference(): Watched<ThemePreference>;
}
