import { Fmt } from '../format/Fmt';
import { stallText } from '../format/stallText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmSection } from '../ui/MmSection';
import { MmDisclosure } from '../ui/MmDisclosure';
import { StatRow } from '../ui/StatRow';
import { usePaceSheet } from './usePaceSheet';

/**
 * Shown on the Coach screen while progress has stalled against the goal
 * (MM-140): which kind of stall it is, in the user's own numbers, with the
 * figures it rests on. Hidden when there is no stall or it is too early to
 * tell. An option the app can act on is a button (a gentler pace opens the
 * choice of pace, MM-128); the rest are plain lines, never instructions.
 */
export function StallCard() {
  const { state } = useApp();
  const stall = useCell(state.stallAssessment);
  const setup = useLoaded(state.setup);
  const openPaceSheet = usePaceSheet();
  if (stall === undefined || setup === undefined || stall.status !== 'stalled') return null;
  const fmt = new Fmt(setup.unitSystem);
  const [body, options] = stallText(stall, fmt);
  const actionFor = (option: string): (() => void) | undefined =>
    /gentler pace/.test(option) && openPaceSheet !== undefined ? () => void openPaceSheet() : undefined;
  return (
    <MmSection icon="trend" title="Progress has slowed">
      <p className="app-text">{body}</p>
      {options.length === 0 ? null : (
        <>
          <p className="coach-options-label">Options</p>
          <ul className="coach-options">
            {options.map((option) => {
              const act = actionFor(option);
              return (
                <li key={option}>
                  {act === undefined ? `· ${option}` : <MmButton label={option} kind="text" onPress={act} />}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <MmDisclosure title="The numbers behind this">
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
    </MmSection>
  );
}
