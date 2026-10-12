import type { TimeSpanProblem } from './TimeSpanProblem';

/**
 * What is wrong with a typed `start` and `end`, or undefined if nothing is
 * (MM-191). Either may be missing; what is there must make sense: an end
 * after its start, and both within `notBefore` and `notAfter` when given.
 * A time that breaks this is refused by the caller, never moved.
 */
export function checkTimeSpan({
  start,
  end,
  notBefore,
  notAfter,
}: {
  start?: Date | undefined;
  end?: Date | undefined;
  notBefore?: Date | undefined;
  notAfter?: Date | undefined;
}): TimeSpanProblem | undefined {
  if (start !== undefined && end !== undefined && !(end.getTime() > start.getTime())) {
    return 'endNotAfterStart';
  }
  for (const time of [start, end]) {
    if (time === undefined) continue;
    if (notBefore !== undefined && time.getTime() < notBefore.getTime()) {
      return 'tooEarly';
    }
    if (notAfter !== undefined && time.getTime() > notAfter.getTime()) {
      return 'tooLate';
    }
  }
  return undefined;
}
