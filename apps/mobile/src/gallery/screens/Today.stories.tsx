import type { Meta } from '@storybook/react-vite';
import { firstDayScenario } from './firstDayScenario';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';

/** The dashboard: where the app opens. */
const meta = { title: 'Screens/Today', ...screensMeta } satisfies Meta;
export default meta;

export const Dashboard = screenStory({ covers: ['DashboardScreen'], shows: 'Macronutrient split' });

export const FirstDay = screenStory({
  covers: ['DashboardScreen'],
  shows: /kcal left/,
  scenario: firstDayScenario,
});
