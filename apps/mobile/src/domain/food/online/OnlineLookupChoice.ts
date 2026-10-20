const values = ['ask', 'always', 'never'] as const;

/**
 * Whether a food the phone does not have may be looked up online (MM-58):
 * ask each time (the default, so the first unknown barcode asks), always,
 * or never. Only the barcode or the typed search words are ever sent.
 */
export type OnlineLookupChoice = (typeof values)[number];

export const OnlineLookupChoice = {
  values,
  /** The choice a stored text stands for; "ask" for anything else. */
  of(text: string): OnlineLookupChoice {
    return (values as readonly string[]).includes(text) ? (text as OnlineLookupChoice) : 'ask';
  },
} as const;
