import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { StatesCatalog } from './StatesCatalog';

const meta = { title: 'Design system/States', component: StatesCatalog } satisfies Meta<typeof StatesCatalog>;
export default meta;

/** MM-273: every control at rest, pressed, disabled, selected and in error. Switch the palette in the toolbar. */
export const States: StoryObj<typeof meta> = { parameters: { shows: 'Destructive' } };

/** The keyboard on the first button: the focus ring, 2 dp outside, never clipped (MM-275). */
export const Focused: StoryObj<typeof meta> = {
  parameters: { shows: 'Destructive' },
  play: async ({ canvasElement }) => {
    const [save] = within(canvasElement).getAllByRole('button', { name: 'Save' });
    save?.focus();
    await userEvent.keyboard('{Shift}');
  },
};

/** The keyboard inside a list group: the ring is drawn inset, so the group's clipping hides none of it (MM-275). */
export const FocusedInGroup: StoryObj<typeof meta> = {
  parameters: { shows: 'Destructive' },
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole('button', { name: /^Opens/ }).focus();
    await userEvent.keyboard('{Shift}');
  },
};
