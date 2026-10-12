import type { Preview } from '@storybook/react-vite';
import '../src/theme/tokens.css';
import '../src/theme/base.css';

/**
 * Every story renders inside the chosen palette's theme class, on its own
 * canvas, exactly as a screen would (MM-237).
 */
const preview: Preview = {
  globalTypes: {
    palette: {
      description: 'Palette',
      toolbar: { title: 'Palette', icon: 'paintbrush', items: ['martian', 'dark', 'light'], dynamicTitle: true },
    },
  },
  initialGlobals: { palette: 'martian' },
  decorators: [
    (Story, context) => (
      <div
        className={`theme-${context.globals['palette']}`}
        style={{ background: 'var(--canvas)', color: 'var(--text)', minHeight: '100vh', padding: 16 }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
