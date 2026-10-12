import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarsCatalog } from './BarsCatalog';

const meta = { title: 'Design system/Bars', component: BarsCatalog } satisfies Meta<typeof BarsCatalog>;
export default meta;

/** The app bar and the navigation bar. */
export const Bars: StoryObj<typeof meta> = {};
