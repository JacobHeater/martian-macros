import { adherenceLines } from '../format/adherenceLines';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { MmSection } from '../ui/MmSection';
import { StatRow } from '../ui/StatRow';

/**
 * What the user did over the last seven days, described and not scored
 * (MM-149), as a section with the checklist icon (MM-256). Nothing here is
 * a grade, and nothing praises eating under target.
 */
export function AdherenceCard() {
  const { state } = useApp();
  const summary = useCell(state.adherenceSummary);
  const floor = useCell(state.coach)?.calorieFloorKcal;
  if (summary === undefined || floor === undefined) return null;
  return (
    <MmSection icon="checklist" title="Your last 7 days">
      {adherenceLines(summary, { floorKcal: floor }).map(([label, value]) => (
        <StatRow key={label} label={label} value={value} />
      ))}
      <p className="app-caption">
        The seven days to yesterday. Days you did not log are not counted against anything.
      </p>
    </MmSection>
  );
}
