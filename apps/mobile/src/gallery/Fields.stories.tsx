import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { FieldsCatalog } from './FieldsCatalog';
import { SlidersCatalog } from './SlidersCatalog';

const meta = { title: 'Design system/Fields', component: FieldsCatalog } satisfies Meta<typeof FieldsCatalog>;
export default meta;

/** Every kind of field, at rest. */
export const Fields: StoryObj<typeof meta> = {};

/** MM-239: the keyboard is in the first field. One mark of focus, the box; nothing drawn inside it. */
export const Focused: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('textbox', { name: 'Search foods' }));
  },
};

/** MM-240: a slider every way a screen holds one, always at the row's inset inside a group. */
export const Sliders: StoryObj<typeof meta> = { render: () => <SlidersCatalog /> };
