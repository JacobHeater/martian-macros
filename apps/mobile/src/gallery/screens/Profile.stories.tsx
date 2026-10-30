import type { Meta } from '@storybook/react-vite';
import { screen, userEvent, within } from 'storybook/test';
import { ProfileScreen } from '../../settings/ProfileScreen';
import { demoWith } from './demoWith';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';

/**
 * MM-705: who the person is and what they are aiming for, out of Settings
 * and on a screen of their own: "You" and "Nutrition goals", both closed
 * until pressed (MM-712), reached from the drawer (MM-704).
 */
const meta = { title: 'Screens/Profile', ...screensMeta } satisfies Meta;
export default meta;

export const Profile = screenStory({
  covers: ['ProfileScreen'],
  shows: 'Nutrition goals',
  open: ({ navigator }) => void navigator.push(() => <ProfileScreen />),
});

/** "You" opened by its header: the four rows. */
export const ProfileYouOpen = screenStory({
  covers: ['ProfileScreen'],
  shows: 'Biological sex',
  open: ({ navigator }) => void navigator.push(() => <ProfileScreen />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'You', expanded: false }));
  },
});

/** From the drawer: Profile pushed over the Dashboard, with Back. */
export const DrawerOpensProfile = screenStory({
  covers: ['ProfileScreen'],
  shows: 'Nutrition goals',
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Menu' }, { timeout: 8000 }));
    const drawer = await screen.findByRole('dialog', { name: 'Menu' });
    await userEvent.click(within(drawer).getByRole('button', { name: 'Profile' }));
  },
});

/** MM-91: on a 360 px phone, with the longest words the two sections carry: a sodium limit, their own water goal and its way back. */
export const ProfileSmallPhone = screenStory({
  covers: ['ProfileScreen'],
  shows: 'Use the suggested amount',
  scenario: demoWith({ sodiumLimitMg: 2300, waterGoalMl: 3000 }),
  about: ['waterGoal'],
  viewport: 'smallPhone',
  open: ({ navigator }) => void navigator.push(() => <ProfileScreen open="nutritionGoals" />),
});
