import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { demoWith } from './demoWith';
import { firstDayScenario } from './firstDayScenario';
import { notWeighedTodayScenario } from './notWeighedTodayScenario';
import { screensMeta } from './screensMeta';
import { reveal } from './reveal';
import { screenStory } from './screenStory';
import { waistDueScenario } from './waistDueScenario';

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

/** Most mornings: no weigh-in yet today, so the Dashboard asks for one in place. */
export const NotWeighedToday = screenStory({
  covers: ['DashboardScreen'],
  shows: 'First thing in the morning, after the bathroom.',
  scenario: notWeighedTodayScenario,
});

/** Weighed today, the waist last measured over a week ago: the Dashboard asks for it in place (MM-301). */
export const WaistDue = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Morning, before eating. Tape level with the navel, snug, breathe out normally.',
  scenario: waistDueScenario,
});

/** Types into a field of the screen, once it is there. */
const type = (name: string, text: string) => async (canvas: HTMLElement) =>
  userEvent.type(await within(canvas).findByRole('textbox', { name }), text);

/** A waist typed and not yet saved: Save is on, and secondary (MM-301). */
export const WaistTyped = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Morning, before eating. Tape level with the navel, snug, breathe out normally.',
  scenario: waistDueScenario,
  walk: type('Today’s waist, inches', '36'),
});

/** A waist no tape could measure, refused under the field (MM-301). */
export const WaistRefused = screenStory({
  covers: ['DashboardScreen'],
  shows: 'That value looks off. Check it.',
  scenario: waistDueScenario,
  walk: type('Today’s waist, inches', '3{Enter}'),
});

/** Both asking and both typed: one primary Save, the waist's secondary (MM-301, PD-1). */
export const BothTyped = screenStory({
  covers: ['DashboardScreen'],
  shows: 'First thing in the morning, after the bathroom.',
  scenario: notWeighedTodayScenario,
  walk: async (canvas) => {
    await type('Today’s weigh-in', '184.2')(canvas);
    await type('Today’s waist, inches', '36')(canvas);
  },
});

/** The weigh-in saved: the snack above the navigation bar offers Progress (MM-294, MM-301, MM-302). */
export const WeighInSaved = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Open Progress',
  scenario: notWeighedTodayScenario,
  walk: type('Today’s weigh-in', '184.2{Enter}'),
});

/** The waist saved on the Dashboard: the snack confirms it above the navigation bar and offers Progress (MM-301, MM-302). */
export const WaistSaved = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Open Progress',
  scenario: waistDueScenario,
  walk: type('Today’s waist, inches', '36{Enter}'),
});

/** MM-313: today's water in the Dashboard's group, a glass in one tap; no goal. */
export const Water = screenStory({
  covers: ['DashboardScreen'],
  shows: /fl oz today/,
  walk: async (canvas) => {
    reveal(await within(canvas).findByRole('button', { name: 'Add a glass of water' }));
  },
});

/** MM-313: a goal of 2.5 L in metric, and the snack after one tap, with Undo. */
export const WaterGlassAdded = screenStory({
  covers: ['DashboardScreen'],
  shows: /Added a glass/,
  scenario: demoWith({ units: 'metric', waterGoalMl: 2500 }),
  walk: async (canvas) => {
    const add = await within(canvas).findByRole('button', { name: 'Add a glass of water' });
    reveal(add);
    await userEvent.click(add);
  },
});

/** MM-313: the first day, no water yet. */
export const WaterNone = screenStory({
  covers: ['DashboardScreen'],
  shows: 'No water yet today',
  scenario: firstDayScenario,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('No water yet today'));
  },
});

/** MM-310 (owner, 2026-10-14): Micros lives on Food; remembered, the Dashboard shows the grams. */
export const MicrosRemembered = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Grams',
  scenario: demoWith({ detail: 'full', picture: 'micros' }),
});
