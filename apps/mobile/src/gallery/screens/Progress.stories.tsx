import type { Meta } from '@storybook/react-vite';
import { StrengthHistoryScreen } from '../../progress/StrengthHistoryScreen';
import { StrengthLiftsScreen } from '../../progress/StrengthLiftsScreen';
import { WeightEventEntrySheet } from '../../progress/WeightEventEntrySheet';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';

/** Weight, waist and strength over time. */
const meta = { title: 'Screens/Progress', ...screensMeta } satisfies Meta;
export default meta;

export const Progress = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Weight trend',
  open: ({ state }) => state.homeTab.put('progress'),
});

export const AddWeightEvent = screenStory({
  covers: ['WeightEventEntrySheet'],
  shows: 'Add a weight event',
  open: ({ state, overlays, today }) => {
    state.homeTab.put('progress');
    void overlays.sheet<void>('Add a weight event', (close) => (
      <WeightEventEntrySheet today={today} onDone={() => close()} />
    ));
  },
});

export const LiftHistories = screenStory({
  covers: ['StrengthLiftsScreen'],
  shows: 'Every logged lift',
  open: ({ navigator }) => void navigator.push(() => <StrengthLiftsScreen />),
});

export const LiftHistory = screenStory({
  covers: ['StrengthHistoryScreen'],
  shows: 'Qualifying sessions',
  open: ({ navigator }) => void navigator.push(() => <StrengthHistoryScreen exerciseId="back-squat" />),
});
