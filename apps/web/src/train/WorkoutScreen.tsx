import { useContext } from 'react';
import type { Workout } from '../domain/training/Workout';
import { lastRestTargetMsOf } from '../engine/lastRestTargetMsOf';
import { Fmt } from '../format/Fmt';
import { personalRecordText } from '../format/personalRecordText';
import { workoutSummaryText } from '../format/workoutSummaryText';
import { CloseScreenContext } from '../app/CloseScreenContext';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import { useOverlays } from '../ui/useOverlays';
import { ExercisePickerScreen } from './ExercisePickerScreen';
import { SetTimerBar } from './SetTimerBar';
import { useRestAlarm } from './useRestAlarm';
import { useWorkoutController } from './useWorkoutController';
import { WorkoutClockCard } from './WorkoutClockCard';
import { WorkoutExerciseCard } from './WorkoutExerciseCard';
import './train.css';

const hasWork = (workout: Workout) => workout.exercises.some((exercise) => exercise.sets.some((set) => set.reps > 0));

/**
 * One workout (MM-75): in progress, to log sets as they are done, or
 * finished, to look at and correct.
 */
export function WorkoutScreen({ workoutId }: { workoutId: number }) {
  const { state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const controller = useWorkoutController();
  const close = useContext(CloseScreenContext);
  const workouts = useLoaded(state.workouts) ?? [];
  const today = useCell(state.today);
  const allRecords = useCell(state.personalRecords);
  const units = useLoaded(state.setup)?.unitSystem ?? 'imperial';
  const workout = workouts.find((w) => w.id === workoutId);
  useRestAlarm(workout);
  // Deleted, or not loaded yet.
  if (workout === undefined) return <Screen title="Workout">{null}</Screen>;
  const records = allRecords.get(workout.id) ?? [];
  const fmt = new Fmt(units);

  const remove = async () => {
    const sure = await overlays.confirm({
      title: 'Delete this workout?',
      message: 'Its exercises and sets are deleted with it.',
      confirmLabel: 'Delete',
    });
    if (!sure) return;
    close?.();
    await controller.delete(workout);
  };

  const addExercise = async () => {
    const exerciseId = await navigator.push<string>((done) => <ExercisePickerScreen onPick={done} />);
    if (exerciseId === undefined) return;
    await controller.addExercise(workout, exerciseId, {
      // A rest target chosen before is there again.
      restTargetMs: lastRestTargetMsOf({ exerciseId, workouts }),
    });
  };

  const finish = async () => {
    await controller.finish(workout);
    close?.();
  };

  return (
    <Screen
      title={workout.inProgress ? 'Workout' : `Workout, ${Fmt.day(workout.date, today)}`}
      actions={<MmIconButton icon="delete" label="Delete workout" onPress={() => void remove()} />}
      footer={workout.inProgress ? <SetTimerBar workout={workout} /> : undefined}
    >
      <p className="app-text app-muted train-summary">{workoutSummaryText(workout)}</p>
      <WorkoutClockCard workout={workout} />
      {records.length === 0 ? null : (
        <InfoCard title={records.length === 1 ? 'Personal record' : 'Personal records'}>
          {records.map((record) => (
            <p key={record.exerciseId} className="app-text">
              {personalRecordText(record, fmt)}
            </p>
          ))}
          <p className="app-caption">
            Your best estimated one-rep max on the lift so far, worked out from reps and load.
          </p>
        </InfoCard>
      )}
      {workout.exercises.length === 0 ? (
        <p className="app-text train-first">Add the first exercise. Each set is one tap once the first is in.</p>
      ) : null}
      {workout.exercises.map((exercise, i) => (
        <WorkoutExerciseCard key={`${i}-${exercise.exerciseId}`} workout={workout} index={i} />
      ))}
      <MmButton label="Add exercise" icon="plus" kind="secondary" expand onPress={() => void addExercise()} />
      {workout.inProgress ? (
        <>
          <div className="app-gap-small" />
          {/* Nothing to keep until a set with reps is logged; an empty workout is deleted from the top bar. */}
          <MmButton label="Finish workout" expand onPress={hasWork(workout) ? () => void finish() : undefined} />
        </>
      ) : null}
    </Screen>
  );
}
