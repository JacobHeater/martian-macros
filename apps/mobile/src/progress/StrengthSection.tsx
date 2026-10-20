import { Fmt } from '../format/Fmt';
import { liftSummary } from '../format/liftSummary';
import { Loadable } from '../state/Loadable';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { StrengthHistoryScreen } from './StrengthHistoryScreen';
import { StrengthLiftsScreen } from './StrengthLiftsScreen';

/**
 * The most-trained lifts and how their estimated strength has moved, with
 * the way to every lift's history. A section (MM-257): open when there are
 * recent lifts to show, folded to one line when there are none. Each lift is
 * a row that opens its history, where its chart lives (MM-344, rule 4).
 */
export function StrengthSection() {
  const { state } = useApp();
  const navigator = useNavigator();
  const trends = useCell(state.strengthTrends);
  const setup = useLoaded(state.setup);
  if (setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem);
  if (Loadable.hasFailed(trends)) {
    return (
      <MmSection icon="train" title="Strength trends">
        <ReadFailedNotice title="Could not read your strength history" onRetry={() => state.retryStrengthHistory()} />
      </MmSection>
    );
  }
  if (!trends.ready) {
    return (
      <MmSection icon="train" title="Strength trends">
        <ScreenLoading />
      </MmSection>
    );
  }
  const all = trends.value;
  const recent = all.filter((trend) => trend.recentSessions > 0);
  let summary: string;
  if (all.length === 0) summary = 'Finish a workout in Train to start your strength history.';
  else if (recent.length === 0) summary = 'No qualifying sessions in the last 90 days.';
  else summary = `${recent.length === 1 ? '1 lift' : `${recent.length} lifts`} over the last 90 days.`;
  return (
    <MmSection icon="train" title="Strength trends" summary={summary} collapsible initiallyExpanded={recent.length > 0} remember={`progress.strength.${recent.length > 0}`}>
      {all.length === 0 ? null : (
        <>
          <>
            {recent.slice(0, 4).map((trend) => (
              <MmListRow
                key={trend.exerciseId}
                // A lift's row carries the trend icon (MM-287): what the row shows is the estimate's movement.
                leadingIcon="trend"
                title={trend.name}
                subtitle={liftSummary(trend, fmt)}
                opens
                onPress={() => void navigator.push(() => <StrengthHistoryScreen exerciseId={trend.exerciseId} />)}
              />
            ))}
            <MmListRow
              leadingIcon="history"
              title="All lift histories"
              subtitle={recent.length === 0 ? 'Earlier sessions, and why an estimate is unavailable' : undefined}
              opens
              onPress={() => void navigator.push(() => <StrengthLiftsScreen />)}
            />
          </>
          <p className="app-caption">Smoothed estimated one-rep max, from finished workouts. A comparison, not a real max.</p>
        </>
      )}
    </MmSection>
  );
}
