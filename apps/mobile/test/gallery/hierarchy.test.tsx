import { composeStories } from '@storybook/react-vite';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import preview from '../../.storybook/preview';
import { hierarchyProblems } from '../support/hierarchyProblems';

/**
 * MM-253, "The rules are checkable": a destination story that nests a card
 * in a card, draws a notice inside a card, shows two macro pictures at
 * once, or draws two primary actions fails here. The rule itself is tested
 * on a built fragment first, so a green run means the rule bites.
 */
type StoriesModule = Parameters<typeof composeStories>[0];

interface ComposedStory {
  (): ReactElement | null;
  parameters: Record<string, unknown>;
  play?: (context: { canvasElement: HTMLElement }) => Promise<void>;
}

/**
 * The six destinations' own stories (the first story of each screens module), over the demo scenario,
 * and the Dashboard on a morning before the weigh-in (MM-292), the state the owner found on his phone.
 */
const modules = import.meta.glob<StoriesModule>('../../src/gallery/screens/*.stories.tsx', { eager: true });
const destinations = ['Dashboard', 'Food', 'Coach', 'Progress', 'Train', 'Settings', 'NotWeighedToday'];
const stories = Object.entries(modules).flatMap(([path, module]) =>
  Object.entries(composeStories(module, preview) as unknown as Record<string, ComposedStory>)
    .filter(([name]) => destinations.includes(name))
    .map(([name, Story]) => ({ id: `${path.replace('../../src/gallery/screens/', '')} › ${name}`, Story })),
);

describe('the rules', () => {
  it('fail a card in a card, a notice in a card, two macro pictures, two primaries and two figures', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<section class="mm-surface"><section class="mm-surface"></section></section>' +
      '<section class="mm-surface"><div class="mm-notice"></div></section>' +
      '<div class="mm-macro-bar"></div><svg class="chart-split-ring"></svg>' +
      '<button class="mm-button mm-button-primary"></button><button class="mm-fab"></button><button class="mm-button mm-button-lead"></button>' +
      '<section class="mm-section"><div class="mm-field"></div></section>' +
      '<section class="mm-hero"><p class="food-hero-figure"></p><p class="chart-stat-figure"></p></section>';
    expect(hierarchyProblems(root)).toEqual([
      'a card is nested in a card or in the hero (rule 1)',
      'a notice is drawn inside a card, the hero or a list group (rule 1)',
      'the macro bars and the macro donut are shown at once (rule 4)',
      '3 primary actions are shown; one is the limit (rule 6)',
      '1 field(s) sit bare on the canvas (rule 1)',
      '2 figures are drawn in the hero; one is the limit (rule 1)',
    ]);
  });

  it('pass a hero, sections, rows and one primary', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<section class="mm-hero"><p class="food-hero-figure"></p><div class="mm-macro-bar"></div></section>' +
      '<section class="mm-section"><div class="mm-list-group"><div class="mm-list-row"><div class="mm-field"></div></div></div></section>' +
      '<div class="mm-notice"></div><button class="mm-button mm-button-primary"></button>';
    expect(hierarchyProblems(root)).toEqual([]);
  });
});

describe('every destination', () => {
  it('has a story under the rule', () => {
    expect(stories.length).toBe(destinations.length);
  });

  it.each(stories)('$id keeps the rules of the direction', async ({ Story }) => {
    const view = render(<Story />);
    const shows = Story.parameters['shows'] as string | RegExp;
    expect((await screen.findAllByText(shows)).length).toBeGreaterThan(0);
    expect(hierarchyProblems(view.container)).toEqual([]);
  });
});

/**
 * MM-416: the Progress sections that hold an entry, drawn open, so the rule is checked where the controls show:
 * Sleep and Waist each keep their fields and Save on a surface.
 */
const openEntries = ['SleepNotRecorded', 'SleepFromWatch', 'SleepMistyped', 'ProgressWaistFirstMeasurements'];
const entryStories = Object.entries(modules).flatMap(([path, module]) =>
  Object.entries(composeStories(module, preview) as unknown as Record<string, ComposedStory>)
    .filter(([name]) => openEntries.includes(name))
    .map(([name, Story]) => ({ id: `${path.replace('../../src/gallery/screens/', '')} › ${name}`, Story })),
);

describe('every open entry on Progress', () => {
  it('has its story', () => {
    expect(entryStories.length).toBe(openEntries.length);
  });

  it.each(entryStories)('$id keeps its fields on a surface', async ({ Story }) => {
    const view = render(<Story />);
    await Story.play?.({ canvasElement: view.container });
    const shows = Story.parameters['shows'] as string | RegExp;
    expect((await screen.findAllByText(shows)).length).toBeGreaterThan(0);
    expect(hierarchyProblems(view.container).filter((problem) => problem.includes('bare'))).toEqual([]);
  });
});
