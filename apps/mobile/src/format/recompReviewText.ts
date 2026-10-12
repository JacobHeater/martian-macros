import type { RecompReview } from '../engine';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

/**
 * What the coach says at a recomp review (MM-133): the verdict in plain
 * words with a next step, or what has to be logged before there can be
 * one. It recommends; it changes nothing and gives no orders.
 */
export function recompReviewText(review: RecompReview): string {
  const weeks = roundHalfAwayFromZero(review.periodDays / 7);
  switch (review.verdict) {
    case 'working':
      return 'It is working. A smaller waist with strength held or rising is what a recomp looks like. Carry on.';
    case 'slowCut':
      return (
        'You are losing weight, which is fine. It is a slow fat loss ' +
        'more than a recomp, and it helps to call it what it is.' +
        `${review.nextGoal === 'fatLoss' ? ' Fat loss at the Gentle pace would match what is happening.' : ''}`
      );
    case 'probablyWorking':
      return (
        'Probably working, slowly. Strength is the earliest signal, ' +
        'and yours is up. Keep going, and measure your waist every week.'
      );
    case 'tooEarly':
      return (
        'Too early to tell. Eight weeks is short for a recomp, and ' +
        'neither your waist nor your strength has clearly moved yet. ' +
        'Keep going and measure your waist every week. The next review ' +
        'is at twelve weeks.'
      );
    case 'notWorking': {
      const seen = 'neither your waist nor your strength has moved the right way';
      switch (review.nextGoal) {
        case 'fatLoss':
          return (
            `Not working so far: over ${weeks} weeks ${seen}. At your body fat a ` +
            'fat loss phase is likely to show more for the same effort.'
          );
        case 'leanGain':
          return (
            `Not working so far: over ${weeks} weeks ${seen}. Lean and trained, ` +
            'building needs a surplus: a lean gain fits better.'
          );
        case 'maintenance':
          return (
            `Not working so far: over ${weeks} weeks ${seen}. Holding at ` +
            'maintenance for a while is a sound next step.'
          );
        case 'recomp':
        case undefined:
          return (
            `Not working so far: over ${weeks} weeks ${seen}. Recomp still fits ` +
            'you, so the training is the place to look first: enough hard ' +
            'sets each week, and loads or reps that go up over time.'
          );
      }
      break;
    }
    case undefined:
      break;
  }
  const needs: string[] = [];
  if (review.missing.includes('waist')) {
    needs.push(
      'at least four waist measurements over the period, one of them ' +
        `in the last two weeks (there are ${review.waistMeasurements}); ` +
        'once a week is enough',
    );
  }
  if (review.missing.includes('strength')) {
    needs.push('two lifts trained in at least six different weeks, and in the last two');
  }
  if (review.missing.includes('weight')) needs.push('weigh-ins going back to the start of the period');
  return `No verdict yet. The review needs ${needs.join('; and ')}.`;
}
