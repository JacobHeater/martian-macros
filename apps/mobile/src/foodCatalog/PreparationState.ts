const codes = { unspecified: 0, raw: 1, cooked: 2, packaged: 3 } as const;

/** Whether a food is described as bought, raw or cooked (MM-43). */
export type PreparationState = keyof typeof codes;

export const PreparationState = {
  values: Object.keys(codes) as readonly PreparationState[],

  /** What the pack stores. */
  code(state: PreparationState): number {
    return codes[state];
  },

  /** The state a pack's code stands for; unspecified for a code not known. */
  fromCode(code: number): PreparationState {
    return (Object.keys(codes) as PreparationState[]).find((state) => codes[state] === code) ?? 'unspecified';
  },
} as const;
