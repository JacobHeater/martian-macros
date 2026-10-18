import { useState } from 'react';
import { InlineInsight } from '../coach/InlineInsight';
import { useExerciseInsights } from '../coach/useExerciseInsights';
import { useInsightPreview } from '../coach/useInsightPreview';
import type { Workout } from '../domain/training/Workout';
import { WorkoutSet } from '../domain/training/WorkoutSet';
import { checkSetTimes } from '../engine/checkSetTimes';
import { defaultLoadStepKg } from '../engine/defaultLoadStepKg';
import { defaultRepRange } from '../engine/defaultRepRange';
import { previousSetsOf } from '../engine/previousSetsOf';
import { suggestProgression } from '../engine/suggestProgression';
import { elapsedText } from '../format/elapsedText';
import { Fmt } from '../format/Fmt';
import { progressionSettingsText } from '../format/progressionSettingsText';
import { progressionText } from '../format/progressionText';
import { restTargetText } from '../format/restTargetText';
import { setText } from '../format/setText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';
import { ProgressionSettingsScreen } from './ProgressionSettingsScreen';
import { SetEditor } from './SetEditor';
import { useWorkoutController } from './useWorkoutController';
import './train.css';

/**
 * The rests on offer (MM-191); zero stands for none, which is where an
 * exercise starts: the app suggests no length of rest.
 */
const restTargetsMs = [0, 60000, 90000, 120000, 180000, 300000] as const;

interface WorkoutExerciseCardProps {
  workout: Workout;
  /** The exercise's place in `workout`. */
  index: number;
}

/**
 * One exercise of a workout (MM-75): what was done last time, its sets,
 * and a button that adds the next set as a copy of the one before.
 */
export function WorkoutExerciseCard({ workout, index }: WorkoutExerciseCardProps) {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const controller = useWorkoutController();
  /** The set whose controls are showing, if any. A set just added is. */
  const [open, setOpen] = useState<number>();
  const exercises = useCell(state.exercisesById);
  const setup = useLoaded(state.setup);
  const workouts = useLoaded(state.workouts) ?? [];
  const progressions = useLoaded(state.exerciseProgressions);
  const preview = useInsightPreview();
  const entry = workout.exercises[index];
  const exercise = entry === undefined ? undefined : exercises.get(entry.exerciseId);
  const coachSays = useExerciseInsights(workout.id, entry?.exerciseId ?? '', exercise?.name ?? '');
  if (entry === undefined) return null;
  // What the coach says under the lift (MM-366, every line, MM-393), or a design story's own line.
  const designed = preview.exerciseNotes?.get(entry.exerciseId);
  const exerciseNotes = designed === undefined ? coachSays : [designed];
  const load = exercise?.load ?? 'addedWeight';
  const units = setup?.unitSystem ?? 'imperial';
  const fmt = new Fmt(units);
  const lastTime = previousSetsOf({ exerciseId: entry.exerciseId, workouts, before: workout.startedAt });
  // The user's own rep range and load step for it, if they set them.
  const settings = progressions?.get(entry.exerciseId);
  const [defaultLow, defaultHigh] = defaultRepRange(exercise);
  // What to try today (MM-79): offered while training, not on a workout
  // being looked back at.
  const suggestion = !workout.inProgress
    ? undefined
    : suggestProgression({
        exerciseId: entry.exerciseId,
        exercise,
        workouts,
        before: workout.startedAt,
        goal: setup?.goalMode ?? 'maintenance',
        units,
        settings,
      });
  const timeLimit = () => workout.endedAt ?? services.clock.now();
  // An exercise of the user's own that has since been deleted.
  const name = exercise?.name ?? 'Deleted exercise';

  const removeExercise = async () => {
    const sure =
      entry.sets.length === 0 ||
      (await overlays.confirm({
        title: 'Remove this exercise?',
        message: 'Its sets in this workout are removed with it.',
        confirmLabel: 'Remove',
      }));
    if (!sure) return;
    setOpen(undefined);
    await controller.removeExercise(workout, index);
  };

  const pickRestTarget = async () => {
    const chosen = await overlays.options<number>({
      title: 'Rest target',
      options: restTargetsMs.map((target) => ({ value: target, label: restTargetText(target === 0 ? undefined : target) })),
      selected: entry.restTargetMs ?? 0,
    });
    if (chosen === undefined) return;
    await controller.setRestTarget(workout, index, chosen.value === 0 ? undefined : chosen.value);
  };

  const addSet = () => {
    // The next set is ready to adjust: its controls are open.
    setOpen(entry.sets.length);
    void controller.addSet(workout, index, {
      // The first set starts from the suggestion, to be changed freely;
      // without one, from last time's first set.
      lastTime:
        suggestion === undefined ? lastTime[0] : new WorkoutSet({ reps: suggestion.reps, loadKg: suggestion.loadKg }),
    });
  };

  return (
    <InfoCard
      title={name}
      trailing={<MmIconButton icon="close" label={`Remove ${name}`} onPress={() => void removeExercise()} />}
    >
      {lastTime.length === 0 ? null : (
        <p className="app-caption train-last-time">Last time: {lastTime.map((s) => setText(s, fmt, load)).join(', ')}</p>
      )}
      {suggestion === undefined ? null : <p className="app-text train-suggestion">{progressionText(suggestion, fmt, load)}</p>}
      {/* The coach's line about this lift, after the facts it rests on (MM-366): none in the app until built. */}
      {exerciseNotes.length === 0 ? null : (
        <div className="train-exercise-insight">
          {exerciseNotes.map((note) => (
            <InlineInsight key={note.rule} insight={note} />
          ))}
        </div>
      )}
      {entry.sets.map((set, s) =>
        s === open ? (
          <SetEditor
            key={`editor-${s}`}
            set={set}
            number={s + 1}
            timeBase={workout.startedAt}
            timeLimit={timeLimit}
            checkTimes={(start, end) =>
              checkSetTimes({
                start,
                end,
                notBefore: workout.startedAt,
                notAfter: timeLimit(),
                otherSets: workout.exercises.flatMap((other, e) => other.sets.filter((_, t) => e !== index || t !== s)),
              })
            }
            load={load}
            fmt={fmt}
            onChange={(changed) => void controller.updateSet(workout, index, s, changed)}
            onRemove={() => {
              setOpen(undefined);
              void controller.removeSet(workout, index, s);
            }}
          />
        ) : (
          <MmListRow
            key={`set-${s}`}
            dense
            title={setText(set, fmt, load)}
            // How long the set took, when it was timed.
            trailing={
              <span className="app-caption">
                {set.durationMs === undefined ? `Set ${s + 1}` : `Set ${s + 1} · ${elapsedText(set.durationMs)}`}
              </span>
            }
            onPress={() => setOpen(s)}
          />
        ),
      )}
      {workout.inProgress ? (
        <>
          <MmListRow
            dense
            title="Suggestions use"
            subtitle={progressionSettingsText({
              repsLow: settings?.repsLow ?? defaultLow,
              repsHigh: settings?.repsHigh ?? defaultHigh,
              loadStepKg: settings?.loadStepKg ?? defaultLoadStepKg({ exercise, units }),
              fmt,
            })}
            opens
            onPress={() => void navigator.push(() => <ProgressionSettingsScreen exerciseId={entry.exerciseId} />)}
          />
          <MmListRow
            dense
            title="Rest target"
            subtitle={restTargetText(entry.restTargetMs)}
            opens
            onPress={() => void pickRestTarget()}
          />
        </>
      ) : null}
      <div className="app-gap-small" />
      <MmButton label="Add set" icon="plus" kind="secondary" expand onPress={addSet} />
    </InfoCard>
  );
}
