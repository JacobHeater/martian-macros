import { ChartPlaceholder } from '../charts/ChartPlaceholder';
import { DayTrack } from '../charts/DayTrack';
import type { CalendarDate } from '../domain/CalendarDate';
import { CycleRule } from '../engine/CycleRule';
import { cycleWindows } from '../engine/cycleWindows';
import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmSection } from '../ui/MmSection';
import { useOverlays } from '../ui/useOverlays';

/** How many recent days are offered to mark. */
const daysShown = 14;

/**
 * Period days, for a female profile (MM-20): the last two weeks as chips,
 * each marked or not with one tap, so the trend expects the water around
 * each start rather than reading it as fat. Above them, the trend chart's
 * days with each flow day a dot and the stretch the trend widens for shaded,
 * or what that line waits for (MM-578). Male profiles never see this.
 */
export function PeriodDaysCard() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  // Only what was marked here can be unmarked here; days read from the health platform shade the chart (MM-68).
  const flowDays = useLoaded(state.typedFlowDays);
  // Every flow day, typed or read, as the trend chart draws them.
  const allFlowDays = useLoaded(state.flowDays) ?? [];
  const today = useCell(state.today);
  const rangeDays = useCell(state.progressRangeDays);
  if (setup === undefined || setup.profile.sex !== 'female' || setup.screening.menopause || flowDays === undefined) return null;
  const marked = new Set(flowDays.map((d) => d.date));
  const toggle = async (date: CalendarDate) => {
    try {
      if (marked.has(date)) await services.flowDays.unmarkFlowDay(date);
      else await services.flowDays.markFlowDay(date);
    } catch {
      overlays.snack('Could not save the period day. Please try again.');
    }
  };
  const days = Array.from({ length: daysShown }, (_, i) => today.addDays(-i));
  return (
    <MmSection icon="calendarCheck" title="Period days">
      <p className="app-text">
        {`Weight commonly rises for a few days around your period. Marking flow days lets the trend expect the water from ${CycleRule.daysBefore} days before each start to ${CycleRule.daysAfter} after it, instead of reading it as fat.`}
      </p>
      {allFlowDays.length === 0 ? (
        <ChartPlaceholder text="No period days marked yet. Each one is a dot on the trend’s days, with the stretch the trend widens for shaded." />
      ) : (
        <DayTrack
          days={rangeDays}
          today={today}
          marks={allFlowDays.map((day) => day.date)}
          bands={cycleWindows(allFlowDays)}
          kind="period"
          label={`Period days over the last ${rangeDays} days, with the days around each start the trend widens for shaded.`}
        />
      )}
      <div className="progress-period-days" role="group" aria-label="Period days, the last two weeks">
        {days.map((date) => (
          <MmChoiceChip key={date.epochDay} label={Fmt.day(date, today)} selected={marked.has(date)} onSelect={() => void toggle(date)} />
        ))}
      </div>
      <p className="app-caption">
        {marked.size === 0 ? 'No period days marked yet.' : `${marked.size} ${marked.size === 1 ? 'day' : 'days'} marked in all. The chart shades the days the trend widens for.`}
      </p>
    </MmSection>
  );
}
