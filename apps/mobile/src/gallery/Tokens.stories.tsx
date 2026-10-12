import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokensCatalog } from './TokensCatalog';

const meta = { title: 'Design system/Tokens', component: TokensCatalog } satisfies Meta<typeof TokensCatalog>;
export default meta;

/** Every color token and type role, live. Switch the palette in the toolbar. */
export const Tokens: StoryObj<typeof meta> = {};
