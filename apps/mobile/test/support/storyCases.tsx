import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import preview from '../../.storybook/preview';
import { configure } from 'storybook/test';

/**
 * MM-394: a walk waits up to five seconds for what it presses, as `pressNamed`
 * does. The default second was too short under coverage (`npm run unseen`),
 * where a workout takes about 1.3 s to draw, so three walks failed on a
 * slower machine though nothing was wrong with them.
 */
configure({ asyncUtilTimeout: 5000 });

type StoriesModule = Parameters<typeof composeStories>[0];

/** A story as Storybook composes it: something to draw, what it says of itself, and its walk. */
export interface ComposedStory {
  (): ReactElement | null;
  parameters: Record<string, unknown>;
  play?: (context: { canvasElement: HTMLElement }) => Promise<void>;
}

const modules = import.meta.glob<StoriesModule>('../../src/**/*.stories.tsx', { eager: true });

/** Every story of the app (MM-237), in a stable order: by file, then as the file declares them. */
export const storyCases: readonly { readonly id: string; readonly Story: ComposedStory }[] = Object.entries(modules)
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  .flatMap(([path, module]) =>
    Object.entries(composeStories(module, preview) as unknown as Record<string, ComposedStory>).map(([name, Story]) => ({
      id: `${path.replace('../../src/', '')} › ${name}`,
      Story,
    })),
  );

/**
 * MM-237, MM-619: draws one shard of the stories, every `count`th from
 * `shard` (1-based), as Storybook draws it, walked to where it goes, and
 * looked at for the words it says it shows. The shards together draw every
 * story once, spread over the workers.
 */
export function drawStoryShard(shard: number, count: number): void {
  const mine = storyCases.filter((_, i) => i % count === shard - 1);
  describe(`every story, shard ${shard} of ${count}`, () => {
    it.each(mine)('$id draws, and shows what it says it shows', async ({ Story }) => {
      const view = render(<Story />);
      await Story.play?.({ canvasElement: view.container });
      const shows = Story.parameters['shows'] as string | RegExp | undefined;
      if (shows === undefined) expect(view.container).not.toBeEmptyDOMElement();
      else expect((await screen.findAllByText(shows)).length).toBeGreaterThan(0);
    });
  });
}
