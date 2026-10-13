import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComponentsCatalog } from './ComponentsCatalog';

const meta = { title: 'Design system/Components', component: ComponentsCatalog } satisfies Meta<typeof ComponentsCatalog>;
export default meta;

/** One of each component, live: what is shown here is what a screen gets. */
export const Components: StoryObj<typeof meta> = {};
