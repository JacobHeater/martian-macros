import { Fmt } from '../format/Fmt';
import { liftSummary } from '../format/liftSummary';
import { Loadable } from '../state/Loadable';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { GroupHeader } from '../ui/GroupHeader';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { StrengthHistoryScreen } from './StrengthHistoryScreen';

/** Every lift that has been logged, each opening its history, as rows of a list group (MM-344). */
export function StrengthLiftsScreen() {
  const { state } = useApp();
  const navigator = useNavigator();
  const trends = useCell(state.strengthTrends);
  const fmt = new Fmt(useLoaded(state.setup)?.unitSystem ?? 'metric');
  const sessions = (n: number) => `${n} logged session${n === 1 ? '' : 's'}`;
  let body;
  // Its own waiting and failure, never the Progress section again (MM-344).
  if (Loadable.hasFailed(trends)) {
    body = <ReadFailedNotice title="Could not read your strength history" onRetry={() => state.retryStrengthHistory()} />;
  } else if (!trends.ready) {
    body = <ScreenLoading />;
  } else {
    body = (
      <>
        <GroupHeader text="Every logged lift" />
        <MmListGroup>
          {trends.value.length === 0 ? <MmListRow leadingIcon="train" title="No finished workouts yet" /> : null}
          {trends.value.map((trend) => (
            <MmListRow
              key={trend.exerciseId}
              leadingIcon="train"
              title={trend.name}
              subtitle={
                // A deleted exercise is told apart by when it was last logged (MM-348).
                trend.exercise === undefined
                  ? `${liftSummary(trend, fmt)} · ${sessions(trend.loggedSessions)}`
                  : `${sessions(trend.loggedSessions)} · ${trend.points.length} qualifying`
              }
              opens
              onPress={() => void navigator.push(() => <StrengthHistoryScreen exerciseId={trend.exerciseId} />)}
            />
          ))}
        </MmListGroup>
      </>
    );
  }
  return <Screen title="Lift histories">{body}</Screen>;
}
