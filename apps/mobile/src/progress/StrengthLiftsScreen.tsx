import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useNavigator } from '../app/useNavigator';
import { InfoCard } from '../ui/InfoCard';
import { MmListRow } from '../ui/MmListRow';
import { StrengthHistoryScreen } from './StrengthHistoryScreen';
import { StrengthSection } from './StrengthSection';

/** Every lift that has been logged, each opening its history. */
export function StrengthLiftsScreen() {
  const { state } = useApp();
  const navigator = useNavigator();
  const trends = useCell(state.strengthTrends);
  return (
    <Screen title="Lift histories">
      {!trends.ready ? (
        <StrengthSection />
      ) : (
        <InfoCard title="Every logged lift">
          {trends.value.length === 0 ? <p className="app-text">No finished workouts yet.</p> : null}
          {trends.value.map((trend) => (
            <MmListRow
              key={trend.exerciseId}
              title={trend.name}
              subtitle={`${trend.loggedSessions} logged sessions · ${trend.points.length} qualifying`}
              opens
              onPress={() => void navigator.push(() => <StrengthHistoryScreen exerciseId={trend.exerciseId} />)}
            />
          ))}
        </InfoCard>
      )}
    </Screen>
  );
}
