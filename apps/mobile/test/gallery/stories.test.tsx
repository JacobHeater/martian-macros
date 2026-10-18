import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import preview from '../../.storybook/preview';
import { configure, getConfig } from 'storybook/test';

/**
 * MM-394: a walk waits up to five seconds for what it presses, as `pressNamed`
 * does. The default second was too short under coverage (`npm run unseen`),
 * where a workout takes about 1.3 s to draw, so three walks failed on a
 * slower machine though nothing was wrong with them.
 */
configure({ asyncUtilTimeout: 5000 });

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

/** Every component the design system exports, by the name of its file. */
function components(): string[] {
  return readdirSync('src/ui')
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => name.replace(/\.tsx$/, ''))
    .filter((name) => /^[A-Z]/.test(name));
}

/** Every component name a gallery file imports from the design system. */
function shownInGallery(folder = 'src/gallery'): Set<string> {
  const shown = new Set<string>();
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const name of shownInGallery(join(folder, entry.name))) shown.add(name);
      continue;
    }
    if (!entry.name.endsWith('.tsx')) continue;
    for (const match of readFileSync(join(folder, entry.name), 'utf8').matchAll(/import \{ (\w+) \} from '(?:\.\.\/)+ui\/(\w+)'/g)) {
      shown.add(match[2] as string);
    }
  }
  return shown;
}

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

  it('has a story that imports every component of the design system (MM-273)', () => {
    const shown = shownInGallery();
    expect(components().filter((name) => !shown.has(name))).toEqual([]);
  });

  it('names only screens that exist', () => {
    const real = new Set(surfaces('src'));
    const unknown = stories.flatMap(({ id, Story }) =>
      ((Story.parameters['covers'] as string[] | undefined) ?? []).filter((name) => !real.has(name)).map((name) => `${id}: ${name}`),
    );
    expect(unknown).toEqual([]);
  });
});

// MM-394: the walks' wait stays long enough for a covered run.
it('a story walk waits at least five seconds for what it presses', () => {
  expect(getConfig().asyncUtilTimeout).toBeGreaterThanOrEqual(5000);
});
