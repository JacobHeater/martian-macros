import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import preview from '../../.storybook/preview';
import { configure } from 'storybook/test';
import * as Food from '../../src/gallery/screens/Food.stories';
import * as Settings from '../../src/gallery/screens/Settings.stories';
import * as FirstRun from '../../src/gallery/screens/FirstRun.stories';

configure({ asyncUtilTimeout: 5000 });
interface ComposedStory {
  (): ReactElement | null;
  parameters: Record<string, unknown>;
  play?: (context: { canvasElement: HTMLElement }) => Promise<void>;
}
const pick = new RegExp(process.env['MM_STORIES'] ?? '.');
const stories = Object.entries({ Food, Settings, FirstRun }).flatMap(([file, module]) =>
  Object.entries(composeStories(module as Parameters<typeof composeStories>[0], preview) as unknown as Record<string, ComposedStory>)
    .filter(([name]) => pick.test(name))
    .map(([name, Story]) => ({ id: `${file}/${name}`, Story })),
);
describe('subset', () => {
  it.each(stories)('$id', async ({ Story }) => {
    const view = render(<Story />);
    await Story.play?.({ canvasElement: view.container });
    const shows = Story.parameters['shows'] as string | RegExp | undefined;
    if (shows === undefined) expect(view.container).not.toBeEmptyDOMElement();
    else expect((await screen.findAllByText(shows)).length).toBeGreaterThan(0);
  });
});
