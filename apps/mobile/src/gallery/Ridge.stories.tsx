import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent } from 'storybook/test';
import { MartianRidge } from '../ui/MartianRidge';

/** MM-558, MM-577: the ground a Martian page ends on; drawn only in the Martian palette. */
const meta = { title: 'Design system/Ridge', component: MartianRidge } satisfies Meta<typeof MartianRidge>;
export default meta;

type Story = StoryObj<typeof meta>;

/** The alien peeks over the tallest peak every 9 s. */
export const Peeking: Story = {};

/** MM-577: the alien tapped, a UFO takes it up and off; it is back five seconds later. */
export const Away: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector('.mm-ridge-alien') as HTMLElement);
  },
};
