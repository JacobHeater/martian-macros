import type { StorybookConfig } from '@storybook/react-vite';

/** The design register (MM-237): every token, icon, component and screen as built. */
const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.tsx'],
  // Storybook reports usage to its makers unless told not to (MM-243).
  // Nothing about this project is sent, and nothing is fetched for news.
  core: {
    disableTelemetry: true,
    enableCrashReports: false,
    disableWhatsNewNotifications: true,
  },
};

export default config;
