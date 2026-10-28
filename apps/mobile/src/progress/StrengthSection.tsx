import { useState } from 'react';
import { ChartPlaceholder } from '../charts/ChartPlaceholder';
import { MiniTrend } from '../charts/MiniTrend';
import type { StrengthTrend } from '../engine/StrengthTrend';
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

/** How many of a lift's latest sessions its row's line draws. */
const sessionsDrawn = 8;

/**
 * The most-trained lifts and how their estimated strength has moved, with
 * the way to every lift's history. A section (MM-257): open when there are
 * recent lifts to show, folded to one line when there are none. Each lift is
 * a row that opens its history, where its chart lives (MM-344, rule 4), and
 * carries a small line of its last sessions' estimates; with none to show,
 * the section says what starts them (MM-578).
 */
export function StrengthSection() {
  const { state } = useApp();
  const navigator = useNavigator();
  const trends = useCell(state.strengthTrends);
  const setup = useLoaded(state.setup);
  const weightDisplay = useCell(state.weightDisplay);
  // Each time the trends go from no recent lift to one, the section is drawn anew, so it opens as it says it
  // starts with lifts; going back to none leaves it as the person has it.
  const hasRecent = trends.ready && trends.value.some((trend) => trend.recentSessions > 0);
  const [hadRecent, setHadRecent] = useState(hasRecent);
  const [opened, setOpened] = useState(0);
  if (hasRecent !== hadRecent) {
    setHadRecent(hasRecent);
    if (hasRecent) setOpened((n) => n + 1);
  }
  if (setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem);
  const weightHidden = weightDisplay === 'hidden';
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
  /** The row's small line: the last sessions' smoothed estimates, none for a bodyweight lift with the weight hidden (MM-118). */
  const line = (trend: StrengthTrend) => {
    const values = trend.points.slice(-sessionsDrawn).map((point) => point.trendKg);
    if (values.length < 2 || (weightHidden && trend.exercise?.load === 'bodyweight')) return undefined;
    return (
      <MiniTrend
        values={values}
        min={Math.min(...values)}
        max={Math.max(...values)}
        slots={sessionsDrawn}
        label={`Estimated max over the last ${values.length} sessions`}
      />
    );
  };
  const all = trends.value;
  const recent = all.filter((trend) => trend.recentSessions > 0);
  let summary: string;
  if (all.length === 0) summary = 'Finish a workout in Train to start your strength history.';
  else if (recent.length === 0) summary = 'No qualifying sessions in the last 90 days.';
  else summary = `${recent.length === 1 ? '1 lift' : `${recent.length} lifts`} over the last 90 days.`;
  return (
    // Keyed apart from the loading and failed sections, and anew when a first recent lift arrives: it starts folded
    // with none and open with some, as it says, rather than as the section before it was left.
    <MmSection key={`trends-${opened}`} icon="train" title="Strength trends" summary={summary} collapsible initiallyExpanded={false} remember={`progress.strength.${recent.length > 0}`}>
      {all.length === 0 ? (
        <ChartPlaceholder text="No strength history yet. Finish a workout in Train; each lift you train gets a line here." />
      ) : (
        <>
          {recent.length === 0 ? (
            <ChartPlaceholder text="No qualifying sessions in the last 90 days. Earlier sessions are in the lift histories." />
          ) : null}
          <>
            {recent.slice(0, 4).map((trend) => (
              <MmListRow
                key={trend.exerciseId}
                // A lift's row carries the trend icon (MM-287): what the row shows is the estimate's movement.
                leadingIcon="trend"
                title={trend.name}
                subtitle={liftSummary(trend, fmt)}
                trailing={line(trend)}
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
