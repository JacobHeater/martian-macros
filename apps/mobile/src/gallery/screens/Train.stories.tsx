import type { Meta } from '@storybook/react-vite';
import { WorkoutController } from '../../state/WorkoutController';
import { CustomExerciseScreen } from '../../train/CustomExerciseScreen';
import { ExercisePickerScreen } from '../../train/ExercisePickerScreen';
import { ProgressionSettingsScreen } from '../../train/ProgressionSettingsScreen';
import { WeeklyVolumeScreen } from '../../train/WeeklyVolumeScreen';
import { WorkoutScreen } from '../../train/WorkoutScreen';
import { WorkoutTimesScreen } from '../../train/WorkoutTimesScreen';
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
