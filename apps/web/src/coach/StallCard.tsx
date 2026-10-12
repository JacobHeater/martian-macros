import { Fmt } from '../format/Fmt';
import { stallText } from '../format/stallText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { InfoCard } from '../ui/InfoCard';
import { MmDisclosure } from '../ui/MmDisclosure';
import { StatRow } from '../ui/StatRow';

/**
 * Shown on the Coach screen while progress has stalled against the goal
 * (MM-140): which kind of stall it is, in the user's own numbers, with the
 * figures it rests on. Hidden when there is no stall or it is too early to
 * tell.
 */
export function StallCard() {
  const { state } = useApp();
  const stall = useCell(state.stallAssessment);
  const setup = useLoaded(state.setup);
  if (stall === undefined || setup === undefined || stall.status !== 'stalled') return null;
  const fmt = new Fmt(setup.unitSystem);
  const [body, options] = stallText(stall, fmt);
  return (
    <InfoCard title="Progress has slowed">
      <p className="app-text">{body}</p>
      {options.length === 0 ? null : (
        <>
          <p className="coach-options-label">Options</p>
          <ul className="coach-options">
            {options.map((option) => (
              <li key={option}>· {option}</li>
            ))}
          </ul>
        </>
      )}
      <MmDisclosure title="What this rests on">
        <StatRow label="Period" value={`Last ${stall.windowDays} days`} />
        <StatRow label="Fully logged days" value={`${stall.usableFoodDays}`} />
        <StatRow label="Weigh-ins" value={`${stall.weighIns}`} />
        {stall.slopeKgPerWeek === undefined ? null : (
          <StatRow label="Trend" value={`${fmt.weightDelta(stall.slopeKgPerWeek)} a week`} />
        )}
        {stall.intendedKgPerWeek === undefined ? null : (
          <StatRow label="Intended" value={`${fmt.weightDelta(stall.intendedKgPerWeek)} a week`} />
        )}
      </MmDisclosure>
    </InfoCard>
  );
}
