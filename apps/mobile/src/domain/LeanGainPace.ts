const values = [
  /** The pace training status sets (MM-25). Never faster. */
  'standard',
  /** Half of it (MM-480): for a gain that looks fat-heavy, or by choice. */
  'slower',
] as const;

/** The lean-gain pace the user chose (MM-480). */
export type LeanGainPace = (typeof values)[number];

export const LeanGainPace = { values, default: 'standard' as LeanGainPace } as const;
