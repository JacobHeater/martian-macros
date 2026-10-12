import type { StorybookConfig } from '@storybook/react-vite';

/** The design register (MM-237): every token, icon and component as built. */
const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.tsx'],
};

export default config;
