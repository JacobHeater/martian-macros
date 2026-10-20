import type { ReliefOffer } from '../engine';
import { shortSleepText } from './shortSleepText';

/**
 * The fixed words of the offer to ease a deficit (MM-117, MM-252). Nothing
 * here suggests eating less, training more or adding cardio. Short sleep
 * from the record is a signal of its own with its own title; typed at the
 * check-in, it is a line.
 */
export function reliefOfferText(offer: ReliefOffer): {
  title: string;
  body: string;
  suggestion: string;
  sleep: string | undefined;
} {
  const hardWeeks = offer.signals.includes('hardCheckIns');
  let suggestion: string;
  if (offer.suggestion === 'maintenanceWeek') {
    suggestion =
      offer.slowerPace === undefined
        ? 'The coach would take a maintenance week: a week at maintenance ' +
          'is a diet break taken early, and the deficit can resume ' +
          'after it.'
        : 'The coach would take a maintenance week: you are ' +
          `${offer.deficitWeeks} weeks into this deficit, and a week at ` +
          'maintenance is a diet break taken early.';
  } else if (hardWeeks) {
    suggestion =
      'The coach would slow the pace: you are early in this deficit, and a ' +
      'gentler pace is easier to hold than a break.';
  } else {
    suggestion = 'The coach would slow the pace: a gentler pace asks less of short nights, and nothing changes until you choose.';
  }
  const average = offer.sleepAverage;
  let sleep: string | undefined;
  if (average !== undefined) {
    sleep = shortSleepText(average);
  } else if (offer.shortSleep) {
    sleep =
      'Your sleep has averaged under six hours. Short sleep during a ' +
      'deficit appears to shift loss away from fat, so sleep may be the ' +
      'cheaper fix.';
  }
  if (!hardWeeks) {
    return {
      title: 'Two weeks of short sleep',
      body: sleep ?? '',
      suggestion,
      sleep: undefined,
    };
  }
  return {
    title: 'Two hard weeks in a row',
    body:
      'Your last two check-ins had most answers at the hard end. On a ' +
      'deficit that usually means it is too large, or has run too long, for ' +
      'you right now. Easing it is the fix.',
    suggestion,
    sleep,
  };
}
