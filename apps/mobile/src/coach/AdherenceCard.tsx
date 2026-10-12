import { adherenceLines } from '../format/adherenceLines';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { InfoCard } from '../ui/InfoCard';
import { StatRow } from '../ui/StatRow';

/**
 * What the user did over the last seven days, described and not scored
 * (MM-149). Nothing here is a grade, and nothing praises eating under
 * target.
 */
export function AdherenceCard() {
  const { state } = useApp();
  const summary = useCell(state.adherenceSummary);
  const floor = useCell(state.coach)?.calorieFloorKcal;
  if (summary === undefined || floor === undefined) return null;
  return (
    <InfoCard title="Your last 7 days">
      {adherenceLines(summary, { floorKcal: floor }).map(([label, value]) => (
        <StatRow key={label} label={label} value={value} />
      ))}
      <p className="app-caption">
        The seven days to yesterday. Days you did not log are not counted against anything.
      </p>
    </InfoCard>
  );
}
