import type { ThemePreference } from '../domain/ThemePreference';

/** Unselected is initialization state, never a theme option. */
export const themeChoices: readonly ThemePreference[] = ['martian', 'light', 'dark', 'system'];
