import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmSection } from '../ui/MmSection';
import { RecompReviewBody } from './RecompReviewBody';

/**
 * The recomp review (MM-133), on the Coach screen for two weeks from 8 and
 * 12 weeks on recomp and every 8 after: a verdict with what was seen, or
 * what is missing. It recommends and changes nothing; the goal is the
 * user's to change.
 */
export function RecompReviewCard() {
  const { state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const review = useCell(state.recompReview);
  const setup = useLoaded(state.setup);
  if (review === undefined || setup === undefined) return null;
  return (
    <MmSection icon="insight" title={`Recomp review, week ${review.week}`} collapsible initiallyExpanded={false} remember="coach.recomp-review">
      <RecompReviewBody review={review} fmt={new Fmt(setup.unitSystem, { weightDisplay })} />
    </MmSection>
  );
}
