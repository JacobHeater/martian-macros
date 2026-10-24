const values = ['new', 'continuing', 'update', 'reversed', 'held', 'resolved', 'backAgain', 'none'] as const;

/**
 * What happened to one key's trend as of a day (MM-605). New, update,
 * reversed and back again are said; resolved is said only where the signal
 * marks it good news; continuing updates the figures silently; held and
 * none say nothing.
 */
export type TrendTransition = (typeof values)[number];

export const TrendTransition = {
  values,

  /** The ranking's order of transitions: 0 is first. Reversed, then new (and back again), resolved, the rest. */
  rank(transition: TrendTransition): number {
    switch (transition) {
      case 'reversed':
        return 0;
      case 'new':
      case 'backAgain':
        return 1;
      case 'resolved':
        return 2;
      case 'update':
      case 'continuing':
        return 3;
      default:
        return 4;
    }
  },
} as const;
