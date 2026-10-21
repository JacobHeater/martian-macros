import type { LeanGainReview } from '../engine/LeanGainReview';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import type { Fmt } from './Fmt';
import { waistAmount } from './waistAmount';

/** A weekly pace as a plain percent, to two places at most: "0.6%", "0.15%". */
const pace = (fraction: number) => `${roundHalfAwayFromZero(fraction * 10000) / 100}%`;

/**
 * What the coach says about a running lean gain (MM-129), a paragraph per
 * finding, in the order they matter: when to stop, too fast, fat-heavy,
 * strength flat. It recommends; it changes no goal.
 */
export function leanGainReviewText(review: LeanGainReview, fmt: Fmt): string[] {
  const said: string[] = [];
  const end = 'maintenance for a while, then a cut if you want one. Your goal stays as it is until you change it.';
  switch (review.stop) {
    case 'bodyFat':
      said.push(
        `${review.bodyFatFromRange ? 'The upper end of your body-fat range' : 'Your estimated body fat'} has reached about ` +
          `${roundHalfAwayFromZero(review.bodyFatPercent)}%, the line where the ` +
          `app calls body fat high. The coach recommends ending the gain now: ${end}`,
      );
      break;
    case 'waist':
      said.push(
        `Your waist is up about ${roundHalfAwayFromZero((review.waistRiseFraction ?? 0) * 100)}% since the gain began. ` +
          `The coach recommends ending it now: ${end}`,
      );
      break;
    case 'weeks':
      said.push(`You have been on lean gain for ${review.weeks} weeks. The coach recommends ending it now: ${end}`);
      break;
    case undefined:
      break;
  }
  if (review.gainingFast && review.gainFraction !== undefined) {
    said.push(
      `You are gaining about ${pace(review.gainFraction)} a week; the aim is ${pace(review.intendedFraction)}. ` +
        'Beyond that pace, the extra is mostly fat. The check-ins bring calories down a step at a time.',
    );
  }
  if (review.fatHeavy && review.waistChangeCm !== undefined && review.weightChangeKg !== undefined) {
    said.push(
      `Over ${review.weeks} weeks your waist is up ${waistAmount(review.waistChangeCm, fmt)} with ` +
        `${fmt.weight(review.weightChangeKg)} of trend weight. The gain looks fat-heavy: more of it is going to your ` +
        'waist than a lean gain usually puts there. A slower gain, or maintenance for a while, would suit. The line ' +
        'between the two is a starting value the app will tune, not a measured one.',
    );
  }
  if (review.strengthFlat && review.weightChangeKg !== undefined) {
    said.push(
      `Over ${review.weeks} weeks of surplus your trend weight is up ${fmt.weight(review.weightChangeKg)}, and none of ` +
        'your tracked lifts has got stronger. That usually means the training, not the food, is the limit: enough ' +
        'hard sets each week, and loads or reps that go up over time. Calories stay as they are.',
    );
  }
  return said;
}
