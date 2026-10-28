import type { Workout } from '../domain/training/Workout';
import { Fmt } from '../format/Fmt';
import { workoutSummaryText } from '../format/workoutSummaryText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { MmIcon } from '../ui/MmIcon';
import { MmListRow } from '../ui/MmListRow';
import { MmRhythmStrip } from '../ui/MmRhythmStrip';
import { MmSection } from '../ui/MmSection';
import { CardioFold } from './CardioFold';
import { trainedDays } from './trainedDays';
import { useWorkoutController } from './useWorkoutController';
import { WeeklyVolumeFold } from './WeeklyVolumeFold';
import { workoutGroups } from './workoutGroups';
import { WorkoutScreen } from './WorkoutScreen';
import './train.css';


/**
 * The Train destination (MM-75), in tiers (MM-258): one primary action,
 * the rhythm of the last seven days, the week's volume and the week's cardio
 * from the wearable as folds in place (MM-677, MM-680, the owner), and
 * finished workouts grouped by week and month with a mark on a record day.
 */
export function TrainScreen() {
  const { state } = useApp();
  const navigator = useNavigator();
  const controller = useWorkoutController();
  const workouts = useLoaded(state.workouts) ?? [];
  const cardio = useCell(state.cardioWeek);
  const today = useCell(state.today);
  const records = useCell(state.personalRecords);
  const inProgress = workouts.find((workout) => workout.inProgress);
  const finished = workouts.filter((workout) => !workout.inProgress);

  const open = (workoutId: number) => void navigator.push(() => <WorkoutScreen workoutId={workoutId} />);
  const start = async (from?: Workout) => open(await controller.start({ from }));

  const row = (workout: Workout) => {
    const count = records.get(workout.id)?.length ?? 0;
    return (
      <MmListRow
        key={workout.id}
        dense
        title={Fmt.day(workout.date, today)}
        subtitle={workoutSummaryText(workout, { records: count })}
        trailing={
          count === 0 ? undefined : (
            <span className="train-record" role="img" aria-label={count === 1 ? 'Personal record' : `${count} personal records`}>
              <MmIcon name="star" size={20} />
            </span>
          )
        }
        opens
        onPress={() => open(workout.id)}
      />
    );
  };

  return (
    <>
      {inProgress !== undefined ? (
        <MmSection icon="timer" title="Workout in progress" summary={workoutSummaryText(inProgress)}>
          <MmButton label="Continue" expand onPress={() => open(inProgress.id)} />
        </MmSection>
      ) : (
        <>
          {finished.length === 0 ? (
            <p className="app-lead train-intro">
              Strength is one of the three things the app watches, with your weight trend and your waist.
            </p>
          ) : null}
          <MmButton label="Start workout" expand onPress={() => void start()} />
          {finished.length === 0 ? null : (
            <div className="train-repeat">
              <MmButton label="Repeat last workout" kind="text" onPress={() => void start(finished[0])} />
            </div>
          )}
        </>
      )}
      <div className="food-rhythm">
        <MmRhythmStrip name="Last seven days of training" days={trainedDays(workouts, today, cardio.ready ? cardio.value.sessions : [])} />
      </div>
      <WeeklyVolumeFold />
      <CardioFold />
      {workoutGroups(finished, today).map((group, index) => (
        <MmSection
          key={group.title}
          icon="calendar"
          title={group.title}
          summary={group.workouts.length === 1 ? '1 workout' : `${group.workouts.length} workouts`}
          collapsible={index > 1}
          initiallyExpanded={index <= 2}
          remember={`train.group.${group.title}`}
        >
          {group.workouts.map(row)}
        </MmSection>
      ))}
    </>
  );
}
