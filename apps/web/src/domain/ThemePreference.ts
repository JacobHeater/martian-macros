const values = ['system', 'light', 'dark', 'martian', 'unselected'] as const;

/** A saved theme choice; unselected is a fresh install awaiting confirmation. */
export type ThemePreference = (typeof values)[number];

export const ThemePreference = { values } as const;
