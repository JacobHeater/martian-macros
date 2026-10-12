import type { TimeSpanProblem } from '../engine';

const messages: Readonly<Record<TimeSpanProblem, string>> = {
  endNotAfterStart: 'The end has to be after the start.',
  tooEarly: 'That is before the workout started.',
  tooLate: 'That is after the workout, or still to come.',
  overlappingSet: 'That overlaps another set in this workout.',
};

/** Why a typed time was not kept (MM-191). */
export const timeSpanProblemMessage = (problem: TimeSpanProblem): string => messages[problem];
