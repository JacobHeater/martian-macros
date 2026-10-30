import type { Meta } from '@storybook/react-vite';
import { screen, userEvent, within } from 'storybook/test';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';

/**
 * MM-704: the app's menu, a drawer slid in from the left over the
 * destination the person is on: the Martian Macros lettering at its head,
 * the four destinations, Profile and Settings. The bar keeps its four.
 */
const meta = { title: 'Screens/Drawer', ...screensMeta } satisfies Meta;
export default meta;

/** Presses the menu button in the app bar and waits for the drawer. */
const openMenu = async (canvas: HTMLElement): Promise<HTMLElement> => {
  await userEvent.click(await within(canvas).findByRole('button', { name: 'Menu' }, { timeout: 8000 }));
  return screen.findByRole('dialog', { name: 'Menu' });
};

/** The drawer open on Dashboard: Dashboard marked current, the rows in their three groups. */
export const DrawerOpen = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Profile',
  walk: async (canvas) => {
    await openMenu(canvas);
  },
});

/** Opened from Food: Food is the row marked current. */
export const DrawerOpenOnFood = screenStory({
  covers: ['FoodScreen'],
  shows: 'Profile',
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    await openMenu(canvas);
  },
});

/** Dragged part of the way back and held: the panel follows the finger on a transform of its own. */
export const DrawerDragged = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Profile',
  walk: async (canvas) => {
    const drawer = await openMenu(canvas);
    await userEvent.pointer([
      { keys: '[TouchA>]', target: drawer, coords: { x: 300, y: 200, clientX: 300, clientY: 200 } },
      { pointerName: 'TouchA', target: drawer, coords: { x: 230, y: 204, clientX: 230, clientY: 204 } },
    ]);
  },
});

/** Settings from the drawer: pushed over the destination, with Back; the gear is gone from the app bar. */
export const DrawerOpensSettings = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Today’s setup',
  walk: async (canvas) => {
    const drawer = await openMenu(canvas);
    await userEvent.click(within(drawer).getByRole('button', { name: 'Settings' }));
  },
});

/** The Library from the drawer (MM-706): pushed over the destination, with Back. */
export const DrawerOpensLibrary = screenStory({
  covers: ['LibraryScreen'],
  shows: 'Usual foods',
  walk: async (canvas) => {
    const drawer = await openMenu(canvas);
    await userEvent.click(within(drawer).getByRole('button', { name: 'Library' }));
  },
});

/** MM-91: the drawer on a 360 px phone at twice the text size: the lettering and every row inside its width. */
export const DrawerOpenSmallPhone = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Profile',
  viewport: 'smallPhone',
  textScale: 2,
  walk: async (canvas) => {
    await openMenu(canvas);
  },
});
