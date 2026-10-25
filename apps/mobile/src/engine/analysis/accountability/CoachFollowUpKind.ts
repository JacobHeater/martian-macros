const values = ['saidBefore', 'repeatOver', 'repeatFat', 'repeatProteinShort', 'adviceTaken'] as const;

/**
 * The coach's accountability (MM-617), each a fact the words layer says:
 *
 * - `saidBefore`: a food it told the person to skip or swap is back.
 * - `repeatOver`: another day this calendar week over target by 500 kcal or more.
 * - `repeatFat`: fat over its target on 3 or more of the last 7 days, today among them.
 * - `repeatProteinShort`: protein short of its minimum on 3 or more of the 7 days before today.
 * - `adviceTaken`: a food it told the person to skip has not been eaten for 3 days or more.
 */
export type CoachFollowUpKind = (typeof values)[number];

export const CoachFollowUpKind = {
  values,

  /** The signal of a finding made for the follow-up alone: `saidBefore`, `repeatOver` (every repeat) or `adviceTaken`. */
  signal(kind: CoachFollowUpKind): 'saidBefore' | 'repeatOver' | 'adviceTaken' {
    return kind === 'saidBefore' || kind === 'adviceTaken' ? kind : 'repeatOver';
  },
} as const;
