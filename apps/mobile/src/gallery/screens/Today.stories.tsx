import type { Meta } from '@storybook/react-vite';
import { firstDayScenario } from './firstDayScenario';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';

/**
 * The dashboard: where the app opens. Before MM-254 (main at 9fb8c79,
 * 2026-10-13) it was a column of eleven same-weight cards with the macro
 * picture drawn twice; after, one hero with the macro switch, the rhythm
 * strip, rows that open their destinations, and the history one tap down.
 */
const meta = { title: 'Screens/Today', ...screensMeta } satisfies Meta;
export default meta;

export const Dashboard = screenStory({ covers: ['DashboardScreen'], shows: 'More about this week' });

export const FirstDay = screenStory({
  covers: ['DashboardScreen'],
  shows: /kcal left/,
  scenario: firstDayScenario,
});
