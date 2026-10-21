import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { Workout } from '../../domain/training/Workout';
import { WorkoutExercise } from '../../domain/training/WorkoutExercise';
import { WorkoutSet } from '../../domain/training/WorkoutSet';
import { WorkoutController } from '../../state/WorkoutController';
import { CustomExerciseScreen } from '../../train/CustomExerciseScreen';
import { ExercisePickerScreen } from '../../train/ExercisePickerScreen';
import { ProgressionSettingsScreen } from '../../train/ProgressionSettingsScreen';
import { WeeklyVolumeScreen } from '../../train/WeeklyVolumeScreen';
import { WorkoutScreen } from '../../train/WorkoutScreen';
import { WorkoutTimesScreen } from '../../train/WorkoutTimesScreen';
import { failingRead } from './failingRead';
import { firstDayScenario } from './firstDayScenario';
import { oldLiftsScenario } from './oldLiftsScenario';
import { reveal } from './reveal';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import type { StoryStage } from './StoryStage';
import { valueOf } from './valueOf';

/**
 * Logging training, set by set. Before MM-258 (main at 9fb8c79,
 * 2026-10-13) two full-width buttons and thirteen identical rows; after,
 * one primary, the week's rhythm, the volume as a section, and workouts
 * grouped by week and month with a mark on a record day.
 */
const meta = { title: 'Screens/Train', ...screensMeta } satisfies Meta;
export default meta;

/** The demo's most recent workout, which is finished. */
const lastWorkout = async ({ services }: StoryStage) => (await valueOf(services.workouts.watchWorkouts()))[0];

export const Train = screenStory({
  covers: ['TrainScreen'],
  shows: 'Start workout',
  open: ({ state }) => state.homeTab.put('train'),
});

export const FinishedWorkout = screenStory({
  covers: ['WorkoutScreen'],
  shows: /^Workout, /,
  open: async (stage) => {
    const workout = await lastWorkout(stage);
    if (workout !== undefined) void stage.navigator.push(() => <WorkoutScreen workoutId={workout.id} />);
  },
});

export const WorkoutInProgress = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'Workout',
  open: async (stage) => {
    const controller = new WorkoutController({ workouts: stage.services.workouts, clock: stage.services.clock });
    const workoutId = await controller.start({ from: await lastWorkout(stage) });
    void stage.navigator.push(() => <WorkoutScreen workoutId={workoutId} />);
  },
});

export const WorkoutTimes = screenStory({
  covers: ['WorkoutTimesScreen'],
  shows: 'Workout times',
  open: async (stage) => {
    const workout = await lastWorkout(stage);
    if (workout !== undefined) void stage.navigator.push(() => <WorkoutTimesScreen workoutId={workout.id} />);
  },
});

export const ChooseExercise = screenStory({
  covers: ['ExercisePickerScreen'],
  shows: 'Choose an exercise',
  open: ({ navigator }) => void navigator.push(() => <ExercisePickerScreen onPick={() => undefined} />),
});

export const YourOwnExercise = screenStory({
  covers: ['CustomExerciseScreen'],
  shows: 'Your own exercise',
  open: ({ navigator }) =>
    void navigator.push(() => <CustomExerciseScreen name="Landmine press" onSaved={() => undefined} />),
});

export const Suggestions = screenStory({
  covers: ['ProgressionSettingsScreen'],
  shows: 'Back squat',
  open: ({ navigator }) => void navigator.push(() => <ProgressionSettingsScreen exerciseId="back-squat" />),
});

export const WeeklyVolume = screenStory({
  covers: ['WeeklyVolumeScreen'],
  shows: 'Weekly training volume',
  open: ({ navigator }) => void navigator.push(() => <WeeklyVolumeScreen />),
});

// ---- MM-321: the Train screen's states no story drew ----

const onTrain = ({ state }: StoryStage) => state.homeTab.put('train');

/** Presses the button named `name`, once it is there. */
const pressNamed = (name: string | RegExp) => async (canvas: HTMLElement) => {
  const button = await within(canvas).findByRole('button', { name }, { timeout: 5000 });
  reveal(button);
  await userEvent.click(button);
};

/** Presses the first button named `name`, once there is one: "Add set" is on every exercise. */
const pressFirst = (name: string | RegExp) => async (canvas: HTMLElement) => {
  const [button] = await within(canvas).findAllByRole('button', { name }, { timeout: 5000 });
  if (button === undefined) return;
  reveal(button);
  await userEvent.click(button);
};

/** Starts a workout from the demo's last one and opens it. */
const startFromLast = async (stage: StoryStage) => {
  const controller = new WorkoutController({ workouts: stage.services.workouts, clock: stage.services.clock });
  const workoutId = await controller.start({ from: await lastWorkout(stage) });
  void stage.navigator.push(() => <WorkoutScreen workoutId={workoutId} />);
};

/** The demo's last workout again today, started an hour ago, eight minutes paused, a set's timer running. */
const midWorkout = (stage: StoryStage, { setRunning = false }: { setRunning?: boolean } = {}) => async () => {
  const last = await lastWorkout(stage);
  const now = stage.services.clock.now();
  const id = await stage.services.workouts.saveWorkout(
    new Workout({
      id: 0,
      date: stage.today,
      startedAt: new Date(now.getTime() - 60 * 60 * 1000),
      pausedForMs: 8 * 60 * 1000,
      setStartedAt: setRunning ? new Date(now.getTime() - 40 * 1000) : undefined,
      exercises: last?.exercises ?? [],
    }),
  );
  void stage.navigator.push(() => <WorkoutScreen workoutId={id} />);
};

/** MM-321: a workout under way shows on Train, and Continue opens it. */
export const TrainWorkoutInProgress = screenStory({
  covers: ['TrainScreen', 'WorkoutScreen'],
  shows: 'Add set',
  open: async (stage) => {
    const controller = new WorkoutController({ workouts: stage.services.workouts, clock: stage.services.clock });
    await controller.start({ from: await lastWorkout(stage) });
    stage.state.homeTab.put('train');
  },
  walk: pressNamed('Continue'),
});

/** MM-321: the week's volume opens from Train. */
export const TrainOpensWeeklyVolume = screenStory({
  covers: ['TrainScreen', 'WeeklyVolumeScreen'],
  shows: 'Weekly training volume',
  open: onTrain,
  walk: pressNamed(/^Weekly training volume/),
});

/** MM-321: the week's volume before any workout. */
export const WeeklyVolumeEmpty = screenStory({
  covers: ['WeeklyVolumeScreen'],
  shows: 'Weekly training volume',
  scenario: firstDayScenario,
  open: ({ navigator }) => void navigator.push(() => <WeeklyVolumeScreen />),
});

/** MM-321: the workouts could not be read for the week's volume. */
export const WeeklyVolumeFailed = screenStory({
  covers: ['WeeklyVolumeScreen'],
  shows: 'Weekly training volume',
  stores: failingRead('workouts', 'watchWorkouts'),
  open: ({ navigator }) => void navigator.push(() => <WeeklyVolumeScreen />),
});

/** MM-321: a new workout with nothing in it yet, and Add exercise opening the picker. */
export const NewWorkoutAddsExercise = screenStory({
  covers: ['WorkoutScreen', 'ExercisePickerScreen'],
  shows: 'Choose an exercise',
  scenario: firstDayScenario,
  open: async (stage) => {
    const controller = new WorkoutController({ workouts: stage.services.workouts, clock: stage.services.clock });
    const workoutId = await controller.start({});
    void stage.navigator.push(() => <WorkoutScreen workoutId={workoutId} />);
  },
  walk: pressNamed('Add exercise'),
});

/** MM-321: a new workout with nothing in it yet. */
export const NewWorkoutEmpty = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'Add exercise',
  scenario: firstDayScenario,
  open: async (stage) => {
    const controller = new WorkoutController({ workouts: stage.services.workouts, clock: stage.services.clock });
    const workoutId = await controller.start({});
    void stage.navigator.push(() => <WorkoutScreen workoutId={workoutId} />);
  },
});

/** MM-321: an exercise not in the library, and making it your own. */
export const ChooseExerciseNotFound = screenStory({
  covers: ['ExercisePickerScreen', 'CustomExerciseScreen'],
  shows: 'Your own exercise',
  open: ({ navigator }) => void navigator.push(() => <ExercisePickerScreen onPick={() => undefined} />),
  walk: async (canvas) => {
    await userEvent.type(await within(canvas).findByRole('textbox', { name: 'Search exercises' }), 'zzqx lift');
    await within(canvas).findByText('No exercise by that name.');
    await pressNamed('Create your own exercise')(canvas);
  },
});

/** MM-321: an hour in, eight minutes paused, a set being timed; MM-222: "Set done" on the bar ends it. */
export const WorkoutTimingASet = screenStory({
  covers: ['WorkoutScreen'],
  shows: /^Tap Set done to record it on /,
  open: (stage) => midWorkout(stage, { setRunning: true })(),
});

/**
 * MM-222: on a 360 px phone, a set being timed with the previous set's
 * controls open: the control that records the set is on the bar, in view.
 */
export const WorkoutTimingASetSmallPhone = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'Set done',
  viewport: 'smallPhone',
  open: (stage) => midWorkout(stage, { setRunning: true })(),
  walk: async (canvas) => {
    const [set] = await within(canvas).findAllByRole('button', { name: /Set 1/ });
    if (set !== undefined) await userEvent.click(set);
  },
});

/** MM-222: a set just added says it is recorded, and "Done" closes it; "Add set" says what it does. */
export const WorkoutSetJustAdded = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'Recorded. Changes are kept as you make them.',
  open: startFromLast,
  walk: pressFirst('Add set'),
});

/** MM-214: reps that are not a whole number are said not to be kept, with what the set has. */
export const WorkoutSetRepsRefused = screenStory({
  covers: ['WorkoutScreen'],
  shows: /^Whole reps only/,
  open: startFromLast,
  walk: async (canvas) => {
    await pressFirst('Add set')(canvas);
    const reps = await within(canvas).findByRole('textbox', { name: 'Reps' });
    await userEvent.clear(reps);
    await userEvent.type(reps, '8.5');
  },
});

/** MM-215: a set removed is offered back. */
export const WorkoutSetRemoved = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'Undo',
  open: startFromLast,
  walk: async (canvas) => {
    await pressFirst('Add set')(canvas);
    await pressNamed('Remove set')(canvas);
  },
});

/** MM-321: a set pressed in a workout under way opens its editor. */
export const WorkoutEditingASet = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'Remove set',
  open: (stage) => midWorkout(stage)(),
  walk: async (canvas) => {
    const [set] = await within(canvas).findAllByRole('button', { name: /Set 1/ });
    if (set !== undefined) await userEvent.click(set);
  },
});

/** MM-321: "Suggestions use" opens the lift's progression settings. */
export const WorkoutOpensSuggestions = screenStory({
  covers: ['WorkoutScreen', 'ProgressionSettingsScreen'],
  shows: 'Back squat',
  open: startFromLast,
  walk: async (canvas) => {
    const [row] = await within(canvas).findAllByRole('button', { name: /^Suggestions use/ });
    if (row !== undefined) await userEvent.click(row);
  },
});

/** MM-321: "Edit times" on a workout under way: the times, and starting the clock again. */
export const WorkoutOpensTimes = screenStory({
  covers: ['WorkoutScreen', 'WorkoutTimesScreen'],
  shows: 'Start the clock again from now',
  open: startFromLast,
  walk: pressNamed('Edit times'),
});

/** MM-321: a workout that is not there (deleted elsewhere): the screen keeps its title and draws nothing. */
export const WorkoutGone = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'Workout',
  open: ({ navigator }) => void navigator.push(() => <WorkoutScreen workoutId={987654} />),
});

/** MM-321: the times of a workout that is not there. */
export const WorkoutTimesGone = screenStory({
  covers: ['WorkoutTimesScreen'],
  shows: 'Workout times',
  open: ({ navigator }) => void navigator.push(() => <WorkoutTimesScreen workoutId={987654} />),
});

/** MM-321: a finished workout that was paused along the way says for how long. */
export const FinishedWorkoutPaused = screenStory({
  covers: ['WorkoutScreen'],
  shows: /^Paused for/,
  open: async (stage) => {
    const last = await lastWorkout(stage);
    if (last === undefined) return;
    const id = await stage.services.workouts.saveWorkout(
      new Workout({
        id: 0,
        date: last.date,
        startedAt: last.startedAt,
        endedAt: last.endedAt,
        pausedForMs: 12 * 60 * 1000,
        exercises: last.exercises,
      }),
    );
    void stage.navigator.push(() => <WorkoutScreen workoutId={id} />);
  },
});

/** MM-321: sets of an exercise since deleted: the volume says what it could not map. */
export const WeeklyVolumeUnmapped = screenStory({
  covers: ['WeeklyVolumeScreen'],
  shows: /^Missing exercise mappings/,
  scenario: oldLiftsScenario,
  open: ({ navigator }) => void navigator.push(() => <WeeklyVolumeScreen />),
});

/** MM-321: a workout's start time pressed opens the clock to set it, to the second (MM-191). */
export const WorkoutTimesSetsTheStart = screenStory({
  covers: ['WorkoutTimesScreen'],
  shows: 'OK',
  open: async (stage) => {
    const workout = await lastWorkout(stage);
    if (workout !== undefined) void stage.navigator.push(() => <WorkoutTimesScreen workoutId={workout.id} />);
  },
  walk: pressNamed(/^Started/),
});

/** MM-321: a set's own start time pressed: the clock to set it, to the second. */
export const SetStartTime = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'OK',
  open: (stage) => midWorkout(stage)(),
  walk: async (canvas) => {
    const [set] = await within(canvas).findAllByRole('button', { name: /Set 1/ });
    if (set !== undefined) await userEvent.click(set);
    const editor = await within(canvas).findByRole('group', { name: 'Set 1' });
    await userEvent.click(within(editor).getByRole('button', { name: /^Started/ }));
  },
});

/**
 * MM-222: a set's start that cannot be right is refused while the clock is
 * open, with the reason: a set that ended half an hour ago, untimed, opens
 * its start on its end.
 */
export const SetStartTimeRefused = screenStory({
  covers: ['WorkoutScreen'],
  shows: 'The end has to be after the start.',
  open: async (stage) => {
    const now = stage.services.clock.now();
    const id = await stage.services.workouts.saveWorkout(
      new Workout({
        id: 0,
        date: stage.today,
        startedAt: new Date(now.getTime() - 60 * 60 * 1000),
        exercises: [
          new WorkoutExercise({
            exerciseId: 'back-squat',
            sets: [new WorkoutSet({ reps: 8, loadKg: 100, endedAt: new Date(now.getTime() - 30 * 60 * 1000) })],
          }),
        ],
      }),
    );
    void stage.navigator.push(() => <WorkoutScreen workoutId={id} />);
  },
  walk: async (canvas) => {
    await pressNamed(/Set 1$/)(canvas);
    const editor = await within(canvas).findByRole('group', { name: 'Set 1' });
    await userEvent.click(within(editor).getByRole('button', { name: /^Started/ }));
  },
});

/** MM-417: Train before any workout is finished: what the screen is for, in one line. */
export const TrainFirstTime = screenStory({
  covers: ['TrainScreen'],
  shows: /^Strength is one of the three things the app watches/,
  scenario: firstDayScenario,
  open: onTrain,
});
