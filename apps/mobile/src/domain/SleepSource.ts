const values = [
  /** The person typed the night on the Progress screen. */
  'typed',
  /** Summed from a health platform's sleep sessions. */
  'imported',
] as const;

/** Where a night of sleep came from (MM-250). A typed night wins over an imported one. */
export type SleepSource = (typeof values)[number];

export const SleepSource = { values } as const;
