import { DietBreakRule, type FallingLift, type ReliefOffer, ReliefRule } from '../engine';
import { shortSleepText } from './shortSleepText';

const rest = 'a rest from dieting, which many people find makes the next weeks easier';
const runs = 'Once taken, it runs its two weeks.';

const tooLarge = 'On a deficit that usually means it is too large, or has run too long, for you right now. Easing it is the fix.';

/** The falling lifts in a sentence, lower case as the recomp signal names them (MM-117). */
function liftsFalling(lifts: readonly FallingLift[]): string {
  const names = lifts.map((lift) => lift.name.toLowerCase());
  const named = names.length <= 2 ? names.join(' and ') : `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
  const drop = Math.round(ReliefRule.strengthDrop * 100);
  return `Over three weeks your estimated max has dropped ${drop}% or more on ${named}, going by the trend, not one session.`;
}

// A deload does this too (MM-117's notes), so carrying on is named as the answer to one.
const lighterWeek = 'A planned lighter week does this too; if that is it, carry on.';

/** What carrying on leads to, from where the person stands: the next ask, or the break the app plans (the panel's UX-3). */
function ifCarryingOn(deficitWeeks: number): string {
  const untilCap = DietBreakRule.forceFromWeeks - deficitWeeks;
  if (untilCap > 3) {
    return `If you carry on, the coach asks again in three weeks, and at ${DietBreakRule.forceFromWeeks} weeks it plans a break itself.`;
  }
  const when = untilCap <= 1 ? 'at the next check-in' : `in ${untilCap} weeks`;
  return `If you carry on, the app plans the break itself ${when}, at ${DietBreakRule.forceFromWeeks} weeks.`;
}

/**
 * The fixed words of the offer to ease a deficit (MM-117, MM-135). Nothing
 * here suggests eating less, training more or adding cardio, and nothing
 * claims a break does anything to metabolism: the evidence grades a break
 * as a rest that eases the diet, not as a repair (MM-135). Short sleep
 * from the record is a signal of its own with its own title; typed at the
 * check-in, it is a line (MM-252). Falling lifts (MM-117, MM-77) are said
 * with the hard weeks when both hold, and with their own title alone.
 */
export function reliefOfferText(offer: ReliefOffer): {
  title: string;
  body: string;
  suggestion: string;
  sleep: string | undefined;
} {
  if (offer.reason === 'longDeficit') {
    return {
      title: `${offer.deficitWeeks} weeks in a deficit`,
      // The title carries the count; the body says what a break is (the panel's PD-1) and that it is a commitment (UX-2).
      body: `A break is two weeks at maintenance: ${rest}. The deficit resumes after it, and the count starts again. ${runs}`,
      suggestion: `The coach would take the break now. ${ifCarryingOn(offer.deficitWeeks)}`,
      sleep: undefined,
    };
  }
  const hardWeeks = offer.signals.includes('hardCheckIns');
  const falling = offer.signals.includes('strengthFalling');
  let suggestion: string;
  if (offer.suggestion === 'break') {
    suggestion =
      offer.slowerPace === undefined
        ? `The coach would take a break: two weeks at maintenance is ${rest}, and the deficit resumes after it. ${runs}`
        : `The coach would take a break: you are ${offer.deficitWeeks} weeks into this deficit, and two weeks at ` +
          `maintenance is ${rest}. ${runs}`;
  } else if (hardWeeks || falling) {
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
  if (!hardWeeks && falling) {
    return {
      title: 'Your lifts are falling',
      body: `${liftsFalling(offer.fallingLifts)} ${tooLarge} ${lighterWeek}`,
      suggestion,
      sleep,
    };
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
    body: `Your last two check-ins had most answers at the hard end. ${tooLarge}${
      falling ? ` ${liftsFalling(offer.fallingLifts)} ${lighterWeek}` : ''
    }`,
    suggestion,
    sleep,
  };
}
