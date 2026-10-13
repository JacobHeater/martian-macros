import type { StoryObj } from '@storybook/react-vite';
import type { ThemePreference } from '../../domain/ThemePreference';
import { StoryApp } from './StoryApp';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';
import type { StoryTerms } from './StoryTerms';

interface ScreenStory {
  /** The screens, sheets and steps this story shows, by the name of their component. */
  covers: readonly string[];
  /** Words on the screen once it has arrived; the stories' test waits for them. */
  shows: string | RegExp;
  scenario?: StoryScenario;
  open?: (stage: StoryStage) => void | Promise<void>;
  /** What a person does from there to reach the screen, given where the story is drawn. */
  walk?: (canvas: HTMLElement) => Promise<void>;
  /** Whether the terms of use were agreed to; they were, unless the story is about them. */
  terms?: StoryTerms;
  /** A new installation has chosen no look yet. */
  unthemed?: boolean;
}

/** A story of the whole app brought to one screen, in the palette of the toolbar. */
export function screenStory({ covers, shows, scenario, open, walk, terms, unthemed = false }: ScreenStory): StoryObj {
  return {
    parameters: { covers, shows },
    render: (_args, { globals }) => {
      const palette = globals['palette'] as ThemePreference;
      return <StoryApp key={palette} palette={unthemed ? undefined : palette} scenario={scenario} terms={terms} open={open} />;
    },
    ...(walk === undefined ? {} : { play: ({ canvasElement }) => walk(canvasElement) }),
  };
}
