import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useNavigator } from '../app/useNavigator';
import type { InsightArea } from '../domain/InsightArea';
import { Fmt } from '../format/Fmt';
import type { HomeDestination } from '../state/HomeDestination';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { WorkoutScreen } from '../train/WorkoutScreen';
import { insightAreaIcon } from './insightAreaIcon';
import type { RecentInsight } from './RecentInsight';
import './coach.css';

/** The order the areas are listed in, as the navigation bar orders their homes. */
const areaOrder: readonly InsightArea[] = ['food', 'training', 'body', 'water', 'sleep'];

/** Where an area's items are logged. */
const home: Record<InsightArea, HomeDestination> = {
  food: 'food',
  training: 'train',
  body: 'dashboard',
  water: 'dashboard',
  sleep: 'progress',
};

/**
 * What the coach said under logged items in the last 14 days (MM-363),
 * grouped by area and newest first, each leading back to its item's day
 * and screen, as Monthly reports lists its reports (MM-33), and folded to
 * its count as that section is (the panel's PD-6). An item since changed
 * keeps what was said, marked, and leads nowhere.
 */
export function RecentInsightsSection({ insights }: { insights: readonly RecentInsight[] }) {
  const { state } = useApp();
  const navigator = useNavigator();
  const today = useCell(state.today);
  const sorted = [...insights].sort(
    (a, b) => areaOrder.indexOf(a.area) - areaOrder.indexOf(b.area) || b.day.epochDay - a.day.epochDay,
  );
  const open = (insight: RecentInsight) => {
    // A lift's insight opens the workout it was said in.
    if (insight.workoutId !== undefined) {
      const workoutId = insight.workoutId;
      void navigator.push(() => <WorkoutScreen workoutId={workoutId} />);
      return;
    }
    state.selectedDay.put(insight.area !== 'food' || insight.day === today ? undefined : insight.day);
    state.homeTab.put(home[insight.area]);
  };
  return (
    <MmSection framed
      icon="insight"
      title="Recent insights"
      summary={
        insights.length === 0
          ? 'None in the last 14 days'
          : `${insights.length} in the last 14 days, under the items they were about`
      }
      collapsible
      remember="coach.recent-insights"
      initiallyExpanded={false}
    >
      {insights.length === 0 ? (
        <p className="app-text">The coach leaves an insight under a food, a lift or a reading when it has something to say about it.</p>
      ) : (
        sorted.map((insight) => (
          <MmListRow
            key={`${insight.area}-${insight.item}-${insight.day.epochDay}`}
            leadingIcon={insightAreaIcon(insight.area)}
            title={insight.item}
            detail={
              <>
                <span className="mm-list-row-subtitle">
                  {Fmt.day(insight.day, today)}: {insight.line}
                </span>
                {insight.changed === true ? <span className="mm-list-row-subtitle coach-recent-changed">Item since changed</span> : null}
              </>
            }
            opens={insight.changed !== true}
            onPress={insight.changed === true ? undefined : () => open(insight)}
          />
        ))
      )}
    </MmSection>
  );
}
