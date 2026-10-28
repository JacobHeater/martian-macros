/** The fixed words of "Coach’s feedback" on the Coach tab (MM-610; named by the owner, MM-620). */
export const coachAnalysisWords = {
  title: 'Coach’s feedback',
  /** The switcher's row, and what a screen reader hears for its choices, as the Dashboard's own. */
  spanName: 'Days shown',
  /** Nothing logged at all yet. */
  nothingLogged: 'Log a food and the coach reads it here.',
  /** History, but nothing logged today, on 1d (MM-612). */
  nothingToday: 'Nothing logged today yet.',
  /** Beside it, when 7d is offered. */
  weekReads: '7d reads the last week.',
  worthChanging: 'Worth changing',
  holdingUp: 'Holding up',
  notEnoughData: 'Not enough data in this span',
  numbersBehind: 'The numbers behind this',
  /** The Dashboard card's way to the section, on the card's span. */
  openOnCoach: 'Open on Coach',
  /** While the person's own model writes the words (MM-673). */
  writing: 'The coach is writing…',
  /** The way out of the wait after three seconds (MM-686): the built-in words at once. */
  answerNow: 'Answer now',
  dismiss: 'Dismiss',
} as const;
