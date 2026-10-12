import type { Workout } from '../domain/training/Workout';
import { Fmt } from '../format/Fmt';
import { workoutSummaryText } from '../format/workoutSummaryText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmIcon } from '../ui/MmIcon';
import { MmListRow } from '../ui/MmListRow';
import { useWorkoutController } from './useWorkoutController';
import { WeeklyVolumeScreen } from './WeeklyVolumeScreen';
import { WorkoutScreen } from './WorkoutScreen';
import './train.css';

/**
 * The Train destination (MM-75): start a workout or carry on with the one
 * in progress, and reopen finished ones.
 */
export function TrainScreen() {
  const { state } = useApp();
  const navigator = useNavigator();
  const controller = useWorkoutController();
  const workouts = useLoaded(state.workouts) ?? [];
  const today = useCell(state.today);
  const records = useCell(state.personalRecords);
  const inProgress = workouts.find((workout) => workout.inProgress);
  const finished = workouts.filter((workout) => !workout.inProgress);

  const open = (workoutId: number) => void navigator.push(() => <WorkoutScreen workoutId={workoutId} />);
  const start = async (from?: Workout) => open(await controller.start({ from }));

  return (
    <>
      {inProgress !== undefined ? (
        <InfoCard title="Workout in progress">
          <p className="app-text">{workoutSummaryText(inProgress)}</p>
          <div className="app-gap-small" />
          <MmButton label="Continue" expand onPress={() => open(inProgress.id)} />
        </InfoCard>
      ) : (
        <>
          {finished.length === 0 ? (
            <p className="app-lead train-intro">
              Log your training here, set by set. Strength is one of the three things the app watches, with your
              weight trend and your waist.
            </p>
          ) : null}
          <MmButton label="Start workout" expand onPress={() => void start()} />
          {finished.length === 0 ? null : (
            <>
              <div className="app-gap-small" />
              <MmButton label="Repeat last workout" kind="secondary" expand onPress={() => void start(finished[0])} />
            </>
          )}
        </>
      )}
      <div className="app-gap" />
      <div className="app-row">
        <MmButton
          label="Weekly training volume"
          kind="secondary"
          onPress={() => void navigator.push(() => <WeeklyVolumeScreen />)}
        />
      </div>
      {finished.length === 0 ? null : (
        <>
          <div className="app-gap" />
          <InfoCard title="Workouts">
            {finished.map((workout) => (
              <MmListRow
                key={workout.id}
                dense
                title={Fmt.day(workout.date, today)}
                subtitle={workoutSummaryText(workout, { records: records.get(workout.id)?.length ?? 0 })}
                trailing={<MmIcon name="chevronRight" />}
                onPress={() => open(workout.id)}
              />
            ))}
          </InfoCard>
        </>
      )}
    </>
  );
}
