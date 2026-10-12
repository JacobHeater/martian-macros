import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import preview from '../../.storybook/preview';

/**
 * MM-237: Storybook is the design register, so a story that does not draw,
 * or a screen with no story, is a hole in it. Every story is drawn here as
 * Storybook draws it, walked to where it goes, and looked at for the words
 * it says it shows; every screen, sheet and step of the app has to be
 * covered by one.
 */
type StoriesModule = Parameters<typeof composeStories>[0];

/** A story as Storybook composes it: something to draw, what it says of itself, and its walk. */
interface ComposedStory {
  (): ReactElement | null;
  parameters: Record<string, unknown>;
  play?: (context: { canvasElement: HTMLElement }) => Promise<void>;
}

const modules = import.meta.glob<StoriesModule>('../../src/**/*.stories.tsx', { eager: true });

const stories = Object.entries(modules).flatMap(([path, module]) =>
  Object.entries(composeStories(module, preview) as unknown as Record<string, ComposedStory>).map(([name, Story]) => ({
    id: `${path.replace('../../src/', '')} › ${name}`,
    Story,
  })),
);

/** Every file of `src` named for a screen, a sheet or a step, by its component's name. */
function surfaces(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return surfaces(join(folder, entry.name));
    const name = /^([A-Z]\w*(?:Screen|Sheet|Step))\.tsx$/.exec(entry.name)?.[1];
    return name === undefined ? [] : [name];
  });
}

/** The frames the screens are drawn in: components, with stories of their own in the catalog. */
const frames = ['Screen', 'MmSheet'];

describe('every story', () => {
  it.each(stories)('$id draws, and shows what it says it shows', async ({ Story }) => {
    const view = render(<Story />);
    await Story.play?.({ canvasElement: view.container });
    const shows = Story.parameters['shows'] as string | RegExp | undefined;
    if (shows === undefined) expect(view.container).not.toBeEmptyDOMElement();
    else expect((await screen.findAllByText(shows)).length).toBeGreaterThan(0);
  });
});

describe('the register', () => {
  it('has a story for every screen, sheet and step of the app', () => {
    const covered = new Set(stories.flatMap(({ Story }) => (Story.parameters['covers'] as string[] | undefined) ?? []));
    const missing = surfaces('src').filter((name) => !frames.includes(name) && !covered.has(name));
    expect(missing).toEqual([]);
  });

  it('names only screens that exist', () => {
    const real = new Set(surfaces('src'));
    const unknown = stories.flatMap(({ id, Story }) =>
      ((Story.parameters['covers'] as string[] | undefined) ?? []).filter((name) => !real.has(name)).map((name) => `${id}: ${name}`),
    );
    expect(unknown).toEqual([]);
  });
});
