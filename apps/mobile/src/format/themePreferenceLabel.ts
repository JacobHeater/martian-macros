import type { ThemePreference } from '../domain';

const labels: Readonly<Record<ThemePreference, string>> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
  martian: 'Martian',
  unselected: 'Martian',
};

export const themePreferenceLabel = (preference: ThemePreference): string => labels[preference];
