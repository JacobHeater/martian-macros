import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartsCatalog } from './ChartsCatalog';

const meta = { title: 'Design system/Charts', component: ChartsCatalog } satisfies Meta<typeof ChartsCatalog>;
export default meta;

/** The charts, drawn from invented figures. */
export const Charts: StoryObj<typeof meta> = {};
