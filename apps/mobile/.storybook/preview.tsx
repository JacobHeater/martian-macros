import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
// The app's own order (src/main.tsx): the tokens, then whatever the
// components bring, then the base rules. A story is styled as a screen is.
import '../src/theme/tokens.css';
import '../src/ui/ui.css';
import '../src/theme/base.css';
import './preview.css';

/**
 * Every story is drawn in the chosen palette, on the document as the app
 * sets it, so what a story puts over itself (a sheet, a dialog) is in the
 * palette too. A component's story gets a padded canvas; a screen's story
 * (`layout: 'fullscreen'`) gets the whole of a phone's viewport (MM-237).
 */
const preview: Preview = {
  globalTypes: {
    palette: {
      description: 'Palette',
      toolbar: { title: 'Palette', icon: 'paintbrush', items: ['martian', 'dark', 'light'], dynamicTitle: true },
    },
  },
  initialGlobals: { palette: 'martian' },
  parameters: {
    viewport: {
      options: {
        phone: { name: 'Phone', styles: { width: '412px', height: '915px' }, type: 'mobile' },
        smallPhone: { name: 'Small phone', styles: { width: '360px', height: '740px' }, type: 'mobile' },
      },
    },
  },
  decorators: [
    (Story, context) => {
      const palette = String(context.globals['palette']);
      const screen = context.parameters['layout'] === 'fullscreen';
      useEffect(() => {
        // A screen's story is the app, which sets the document's palette itself.
        if (!screen) document.documentElement.className = `theme-${palette}`;
      }, [palette, screen]);
      return (
        <div className={screen ? 'story-screen' : `story-canvas theme-${palette}`}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
