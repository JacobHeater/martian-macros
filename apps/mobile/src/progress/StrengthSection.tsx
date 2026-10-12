import { Fmt } from '../format/Fmt';
import { Loadable } from '../state/Loadable';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmSpinner } from '../ui/MmSpinner';
import { StrengthTrendCard } from '../ui/StrengthTrendCard';
import { StrengthHistoryScreen } from './StrengthHistoryScreen';
import { StrengthLiftsScreen } from './StrengthLiftsScreen';

/** The most-trained lifts and how their estimated strength has moved, with the way to every lift's history. */
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
      <InfoCard title="Strength trends">
        <p className="app-text">Could not load strength history. Your logged sets are not changed.</p>
        <MmButton label="Retry strength history" onPress={() => state.retryStrengthHistory()} />
      </InfoCard>
    );
  }
  if (!trends.ready) {
    return (
      <InfoCard title="Strength trends">
        <MmSpinner />
      </InfoCard>
    );
  }
  const all = trends.value;
  return (
    <>
      <InfoCard title="Strength trends">
        <p className="app-text">
          {all.length === 0
            ? 'Finish a workout in Train to start your strength history.'
            : 'Your most-trained lifts over the last 90 days. Each point comes from a finished workout.'}
        </p>
        {all.length === 0 ? null : (
          <MmButton
            label="All lift histories"
            kind="secondary"
            onPress={() => void navigator.push(() => <StrengthLiftsScreen />)}
          />
        )}
      </InfoCard>
      {all
        .filter((trend) => trend.recentSessions > 0)
        .slice(0, 4)
        .map((trend) => (
          <StrengthTrendCard
            key={trend.exerciseId}
            trend={trend}
            fmt={fmt}
            today={today}
            onHistory={() => void navigator.push(() => <StrengthHistoryScreen exerciseId={trend.exerciseId} />)}
          />
        ))}
      {all.length > 0 && all.every((trend) => trend.recentSessions === 0) ? (
        <p className="app-text">
          No qualifying sessions in the last 90 days. Open a lift history to see earlier sessions or why an estimate
          is unavailable.
        </p>
      ) : null}
    </>
  );
}
