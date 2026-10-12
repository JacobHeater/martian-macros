import type { ThemePreference } from '../ThemePreference';

/** Writes the user's device-level display preferences. */
export interface PreferencesWriter {
  saveThemePreference(preference: ThemePreference): Promise<void>;
}
