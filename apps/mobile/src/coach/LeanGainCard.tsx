import { Fmt } from '../format/Fmt';
import { leanGainReviewText } from '../format/leanGainReviewText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmSection } from '../ui/MmSection';
import { StatRow } from '../ui/StatRow';

/**
 * The lean-gain guardrails (MM-129), on the Coach screen while a gain has
 * something to say: too fast, fat-heavy, time to end it, or weight up with
 * strength flat. Built like the recomp review beside it (MM-133). It
 * recommends; the goal changes only when the person chooses another.
 */
export function LeanGainCard({ onChangeGoal }: { onChangeGoal: () => void }) {
  const { state } = useApp();
  const review = useCell(state.leanGainReview);
  const setup = useLoaded(state.setup);
  if (review === undefined || setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem);
  return (
    <MmSection icon="insight" title={`Lean gain, week ${review.weeks}`}>
      {leanGainReviewText(review, fmt).map((text) => (
        <p key={text} className="app-text">
          {text}
        </p>
      ))}
      <StatRow
        label="Trend weight"
        value={review.weightChangeKg === undefined ? 'Not enough logged' : fmt.weightDelta(review.weightChangeKg)}
      />
      <StatRow label="Intended pace" value={Fmt.percentPerWeek(review.intendedFraction)} />
      {review.offersGoalChange ? <MmButton label="Choose a goal" kind="secondary" onPress={onChangeGoal} /> : null}
    </MmSection>
  );
}
