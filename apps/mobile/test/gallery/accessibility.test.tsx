import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import { computeAccessibleName, isInaccessible } from 'dom-accessibility-api';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import preview from '../../.storybook/preview';

/**
 * MM-106, the rules jsdom can honestly check on every destination
 * (`design/accessibility-checklist.md`, section 2): every control has a
 * name a reader would say; nothing is said by colour alone (a notice has
 * its icon and its words, a macro bar its name and figures, the current
 * destination is `aria-current`); a row that swipes away offers its
 * removal as a button; a chart is an image with a sentence. Sizes, layout
 * and the sense of it by ear are not claimed here.
 */
type StoriesModule = Parameters<typeof composeStories>[0];

interface ComposedStory {
  (): ReactElement | null;
  parameters: Record<string, unknown>;
}

const modules = import.meta.glob<StoriesModule>('../../src/gallery/screens/*.stories.tsx', { eager: true });
const destinations = ['Dashboard', 'Food', 'Coach', 'Progress', 'Train', 'Settings', 'NotWeighedToday'];
const stories = Object.entries(modules).flatMap(([path, module]) =>
  Object.entries(composeStories(module, preview) as unknown as Record<string, ComposedStory>)
    .filter(([name]) => destinations.includes(name))
    .map(([name, Story]) => ({ id: `${path.replace('../../src/gallery/screens/', '')} › ${name}`, Story })),
);

/** What a reader stops on: every control, and every image that is not decoration. */
const controls = 'button, [role="button"], input, select, textarea, [role="switch"], [role="slider"], [role="img"], a[href]';

const nameOf = (element: Element) => computeAccessibleName(element).trim();

describe('every destination', () => {
  it('is drawn under the rules', () => {
    expect(stories.length).toBe(destinations.length);
  });

  it.each(stories)('$id: every control and image has a name', async ({ Story }) => {
    const view = render(<Story />);
    const shows = Story.parameters['shows'] as string | RegExp;
    await screen.findAllByText(shows);
    const unnamed = [...view.container.querySelectorAll(controls)]
      .filter((element) => element.getAttribute('aria-hidden') !== 'true' && (element as HTMLElement).hidden !== true)
      .filter((element) => nameOf(element) === '')
      .map((element) => `${element.tagName.toLowerCase()}.${element.className.toString().split(' ')[0] ?? ''}`);
    expect(unnamed).toEqual([]);
  });

  it.each(stories)('$id: nothing is said by colour alone', async ({ Story }) => {
    const view = render(<Story />);
    await screen.findAllByText(Story.parameters['shows'] as string | RegExp);
    for (const notice of view.container.querySelectorAll('.mm-notice')) {
      expect(notice.querySelector('.mm-notice-icon svg'), 'a notice carries its icon').not.toBeNull();
      expect(notice.querySelector('.mm-notice-body')?.textContent?.trim(), 'a notice carries its words').not.toBe('');
    }
    for (const bar of view.container.querySelectorAll('.mm-macro-bar')) {
      expect(bar.querySelector('.mm-macro-bar-name')?.textContent?.trim(), 'a macro bar carries its name').toMatch(/\S/);
      expect(bar.querySelector('.mm-macro-bar-figures')?.textContent?.trim(), 'a macro bar carries its figures').toMatch(/\d/);
    }
    const current = view.container.querySelectorAll('.mm-nav-destination-current');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('aria-current', 'page');
    for (const segment of view.container.querySelectorAll('.mm-segment-selected')) {
      expect(segment).toHaveAttribute('aria-pressed', 'true');
      // Seen, not only spoken: the chosen segment carries its check mark, compact or not (MM-437).
      expect(segment.querySelector('svg'), 'a chosen segment shows its check').not.toBeNull();
    }
    // A method icon says its word; the water tile's drop in the same place is decoration, hidden from readers.
    for (const method of view.container.querySelectorAll('.food-entry-method')) {
      if (isInaccessible(method)) continue;
      expect(nameOf(method), 'a method icon says its word').toMatch(/\S/);
    }
  });

  it.each(stories)('$id: every swipe has a button, and every chart a sentence', async ({ Story }) => {
    const view = render(<Story />);
    await screen.findAllByText(Story.parameters['shows'] as string | RegExp);
    for (const row of view.container.querySelectorAll('.mm-swipe')) {
      const menus = [...row.querySelectorAll('button')].filter((button) => /^More actions/.test(nameOf(button)));
      expect(menus.length, 'a swipe row offers its actions as a button').toBeGreaterThan(0);
    }
    for (const chart of view.container.querySelectorAll('svg.chart-plot')) {
      expect(chart).toHaveAttribute('role', 'img');
      expect(nameOf(chart)).toMatch(/\w+ .*\d/);
    }
  });
});
