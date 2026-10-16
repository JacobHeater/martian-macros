import type { MeasuredChange } from '../engine/MeasuredChange';
import type { RecompReview } from '../engine/RecompReview';
import type { Fmt } from '../format/Fmt';
import { recompReviewText } from '../format/recompReviewText';
import { signedPercent } from '../format/signedPercent';
import { waistAmount } from '../format/waistAmount';
import { StatRow } from '../ui/StatRow';

const direction = (change: MeasuredChange | undefined): string => {
  if (change === 'down') return 'Down';
  if (change === 'up') return 'Up';
  return change === 'noClearChange' ? 'No clear change' : 'Not enough logged';
};

const lifts = (names: readonly string[]) => names.map((name) => name.toLowerCase()).join(', ');

/**
 * What a recomp review says and rests on (MM-133): the verdict in words,
 * the period, and what was seen of weight, waist and strength. The same on
 * the Coach screen and in the monthly report.
 */
export function RecompReviewBody({ review, fmt }: { review: RecompReview; fmt: Fmt }) {
  const weight = review.weightChangeFraction;
  const waistCm = review.waistChangeCm;
  let strength = 'Not enough logged';
  if (review.strength === 'up') strength = `Up: ${lifts(review.liftsUp)}`;
  else if (review.strength === 'down') strength = `Down: ${lifts(review.liftsDown)}`;
  else if (review.strength === 'noClearChange') strength = 'Held';
  return (
    <>
      <p className="app-text">{recompReviewText(review)}</p>
      <StatRow label="Period" value={`${review.periodDays} days`} />
      <StatRow
        label="Trend weight"
        value={weight === undefined ? 'Not enough logged' : signedPercent(weight)}
      />
      <StatRow
        label="Waist"
        value={
          review.waist === 'noClearChange' || waistCm === undefined
            ? direction(review.waist)
            : `${direction(review.waist)} ${waistAmount(waistCm, fmt)}`
        }
      />
      <StatRow label="Strength" value={strength} />
      <p className="app-caption">
        A tape and a scale cannot measure a pound of muscle. This is the direction of travel, not a measurement of it.
        Your goal stays as it is unless you change it.
      </p>
    </>
  );
}
