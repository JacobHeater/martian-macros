import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { OverlaysCatalog } from './OverlaysCatalog';

/** MM-273: every overlay can be looked at on its own, in three palettes. */
const meta = { title: 'Design system/Overlays', component: OverlaysCatalog } satisfies Meta<typeof OverlaysCatalog>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Dialog: Story = { args: { kind: 'dialog' }, parameters: { shows: 'A question' } };

/** MM-280: the destructive action quiet, Cancel the stronger button. */
export const Confirm: Story = { args: { kind: 'confirm' }, parameters: { shows: 'Erase everything?' } };

export const Choice: Story = { args: { kind: 'choice' }, parameters: { shows: 'Keep these targets?' } };

/** MM-261, MM-271: the current value marked Chosen, and a Cancel. */
export const Options: Story = { args: { kind: 'options' }, parameters: { shows: 'Daily activity' } };

/** MM-263: the calendar in its dialog, the day said back in words. */
export const Date: Story = { args: { kind: 'date' }, parameters: { shows: 'January 1, 1996' } };

/** MM-264: the drums in their dialog, the time said back in words. */
export const Time: Story = { args: { kind: 'time' }, parameters: { shows: '7:30 AM' } };

/** MM-321: a time outside the hours allowed: the dialog says the range. */
export const TimeRefused: Story = { args: { kind: 'timeRefused' }, parameters: { shows: /^Choose a time between/ } };

/** MM-321: a day outside the dates allowed: the dialog says the range. */
export const DateRefused: Story = { args: { kind: 'dateRefused' }, parameters: { shows: /1926/ } };

/** MM-264: the drums with seconds, for a set's clock. */
export const Clock: Story = { args: { kind: 'clock' }, parameters: { shows: '12:02:10 PM' } };

/** The two pickers outside a dialog. */
export const Pickers: Story = { args: { kind: 'pickers' }, parameters: { shows: 'January 1996' } };

/** MM-277, MM-271: a sheet through the host, on the raised surface, with Close. */
export const Sheet: Story = { args: { kind: 'sheet' }, parameters: { shows: /A sheet rises/ } };

export const SheetBare: Story = { args: { kind: 'sheetBare' }, parameters: { shows: 'The sheet on its own.' } };

/** MM-272: a snack with nothing to press goes after four seconds. */
export const Snack: Story = { args: { kind: 'snack' }, parameters: { shows: 'Saved.' } };

/** MM-272: a snack with Undo waits, with a Dismiss beside it. */
export const SnackUndo: Story = { args: { kind: 'snackUndo' }, parameters: { shows: 'Removed Oats, 80 g' } };

/** MM-268: the menu drawn on its own at an anchor. */
export const Menu: Story = { args: { kind: 'menu' }, parameters: { shows: 'Copy to today' } };

/** MM-268: a menu opened from its button, through the host, where nothing clips it. */
export const MenuOpen: Story = {
  args: { kind: 'menuButton' },
  parameters: { shows: 'Copy to today' },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'More actions for Oats' }));
  },
};

/** MM-321: the open menu walked with the keyboard: the arrow moves between its items. */
export const MenuKeyboard: Story = {
  args: { kind: 'menuButton' },
  parameters: { shows: 'Copy to today' },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'More actions for Oats' }));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{End}{Home}');
  },
};

/** MM-321: the date picker's year list open, the shown year chosen. */
export const PickersYears: Story = {
  args: { kind: 'pickers' },
  parameters: { shows: '1996' },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /^January 1996/ }));
  },
};
