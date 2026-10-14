import { Fmt } from '../format/Fmt';
import { Loadable } from '../state/Loadable';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { MmSection } from '../ui/MmSection';
import { MmSpinner } from '../ui/MmSpinner';
import { StrengthTrendCard } from '../ui/StrengthTrendCard';
import { StrengthHistoryScreen } from './StrengthHistoryScreen';
import { StrengthLiftsScreen } from './StrengthLiftsScreen';

/**
 * The most-trained lifts and how their estimated strength has moved, with
 * the way to every lift's history. A section (MM-257): open when there are
 * recent lifts to show, folded to one line when there are none.
 */
export function StrengthSection() {
  const { state } = useApp();
  const navigator = useNavigator();
  const trends = useCell(state.strengthTrends);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  if (setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem);
  if (Loadable.hasFailed(trends)) {
    return (
      <MmSection icon="train" title="Strength trends">
        <p className="app-text">Could not load strength history. Your logged sets are not changed.</p>
        <MmButton label="Retry strength history" kind="secondary" onPress={() => state.retryStrengthHistory()} />
      </MmSection>
    );
  }
  if (!trends.ready) {
    return (
      <MmSection icon="train" title="Strength trends">
        <MmSpinner />
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
    <MmSection icon="train" title="Strength trends" summary={summary} collapsible initiallyExpanded={recent.length > 0}>
      {all.length === 0 ? null : (
        <>
          <p className="app-text">
            Your most-trained lifts over the last 90 days. Each point comes from a finished workout.
          </p>
          <MmButton
            label="All lift histories"
            kind="secondary"
            onPress={() => void navigator.push(() => <StrengthLiftsScreen />)}
          />
        </>
      )}
      {recent.slice(0, 4).map((trend) => (
        <StrengthTrendCard
          key={trend.exerciseId}
          trend={trend}
          fmt={fmt}
          today={today}
          onHistory={() => void navigator.push(() => <StrengthHistoryScreen exerciseId={trend.exerciseId} />)}
        />
      ))}
      {all.length > 0 && recent.length === 0 ? (
        <p className="app-text">
          No qualifying sessions in the last 90 days. Open a lift history to see earlier sessions or why an estimate
          is unavailable.
        </p>
      ) : null}
    </MmSection>
  );
}
