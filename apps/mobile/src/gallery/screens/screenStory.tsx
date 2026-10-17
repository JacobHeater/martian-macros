import type { StoryObj } from '@storybook/react-vite';
import type { InsightPreview } from '../../coach/InsightPreview';
import type { ThemePreference } from '../../domain/ThemePreference';
import { StoryApp } from './StoryApp';
import type { StoryDevice } from './StoryDevice';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';
import type { StoryStores } from './StoryStores';
import type { StoryTerms } from './StoryTerms';

interface ScreenStory {
  /** The screens, sheets and steps this story shows, by the name of their component. */
  covers: readonly string[];
  /**
   * Words on the screen once it has arrived; the stories' test waits for them. Left out only for a
   * state with no words at all, the app's spinner while a read is out (MM-321).
   */
  shows?: string | RegExp;
  scenario?: StoryScenario;
  /** What the phone brings; nothing of a device unless a story is about it. */
  device?: StoryDevice;
  /** How storage behaves: a read still loading or one that failed (MM-321); every read ready unless given. */
  stores?: StoryStores;
  open?: (stage: StoryStage) => void | Promise<void>;
  /** What a person does from there to reach the screen, given where the story is drawn. */
  walk?: (canvas: HTMLElement) => Promise<void>;
  /** Whether the terms of use were agreed to; they were, unless the story is about them. */
  terms?: StoryTerms;
  /** A new installation has chosen no look yet. */
  unthemed?: boolean;
  /** The demo build, with its notice around every screen (MM-177). */
  demo?: boolean;
  /** Inline insights, grades and Settings > Coach drawn before they are built (MM-361). */
  preview?: InsightPreview;
  /** The phone's text size as a multiple of the default (2 is 200%). */
  textScale?: number;
  /** A viewport other than the phone's: `smallPhone` (360 px) or `narrowPhone` (320 px). */
  viewport?: 'smallPhone' | 'narrowPhone';
}

/** A story of the whole app brought to one screen, in the palette of the toolbar. */
export function screenStory({
  covers,
  shows,
  scenario,
  device,
  stores,
  open,
  walk,
  terms,
  unthemed = false,
  demo = false,
  preview,
  textScale,
  viewport,
}: ScreenStory): StoryObj {
  return {
    parameters: shows === undefined ? { covers } : { covers, shows },
    ...(viewport === undefined ? {} : { globals: { viewport: { value: viewport, isRotated: false } } }),
    render: (_args, { globals }) => {
      const palette = globals['palette'] as ThemePreference;
      return (
        <StoryApp
          key={palette}
          palette={unthemed ? undefined : palette}
          scenario={scenario}
          device={device}
          stores={stores}
          terms={terms}
          demo={demo}
          open={open}
          preview={preview}
          textScale={textScale}
        />
      );
    },
    ...(walk === undefined ? {} : { play: ({ canvasElement }) => walk(canvasElement) }),
  };
}
