import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconsCatalog } from './IconsCatalog';

const meta = { title: 'Design system/Icons', component: IconsCatalog } satisfies Meta<typeof IconsCatalog>;
export default meta;

/** The Material Outlined set behind the app's names (MM-236). */
export const Icons: StoryObj<typeof meta> = {};
