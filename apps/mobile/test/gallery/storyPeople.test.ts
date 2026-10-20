import { composeStories } from '@storybook/react-vite';
import { describe, expect, it } from 'vitest';
import preview from '../../.storybook/preview';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { demoScenario } from '../../src/gallery/screens/demoScenario';
import { storyFacts } from '../../src/gallery/screens/storyFacts';
import type { StoryScenario } from '../../src/gallery/screens/StoryScenario';
import type { StorySubject } from '../../src/gallery/screens/StorySubject';
import { storyToday } from '../../src/gallery/screens/storyToday';

/**
 * MM-357: every screen story's person is the demo person, imperial, with the
 * water goal suggested for them, except in what the story declares itself
 * about (`about` on `screenStory`). An audit (MM-356) had found twelve
 * stories metric and six water goals of different amounts for no reason, so
 * their screens read differently from the rest.
 */
type StoriesModule = Parameters<typeof composeStories>[0];

interface ComposedStory {
  parameters: Record<string, unknown>;
}

const modules = import.meta.glob<StoriesModule>('../../src/gallery/screens/*.stories.tsx', { eager: true });
const stories = Object.entries(modules).flatMap(([path, module]) =>
  Object.entries(composeStories(module, preview) as unknown as Record<string, ComposedStory>).map(([name, Story]) => ({
    id: `${path.replace('../../src/gallery/screens/', '')} › ${name}`,
    scenario: (Story.parameters['scenario'] as StoryScenario | undefined) ?? demoScenario,
    about: (Story.parameters['about'] as readonly StorySubject[] | undefined) ?? [],
  })),
);

/** The facts of a scenario's person, worked out once per scenario: most stories share the demo's. */
const facts = new Map<StoryScenario, Promise<ReadonlyMap<string, string>>>();
function factsOf(scenario: StoryScenario): Promise<ReadonlyMap<string, string>> {
  let known = facts.get(scenario);
  if (known === undefined) {
    known = (async () => {
      const repos = new InMemoryRepositories();
      await scenario(repos, storyToday);
      return new Map(await storyFacts(repos, storyToday, { stores: false, device: false }));
    })();
    facts.set(scenario, known);
  }
  return known;
}

describe('every screen story’s person', () => {
  it('is the demo person in units and water goal, except in what the story is about', async () => {
    const demo = await factsOf(demoScenario);
    expect(demo.get('Units')).toBe('Imperial');
    expect(demo.get('Water goal')).toMatch(/, suggested$/);
    const differing: string[] = [];
    for (const { id, scenario, about } of stories) {
      const person = await factsOf(scenario);
      // A new installation has no person to compare.
      if (!person.has('Units')) continue;
      const units = person.get('Units');
      if (!about.includes('units') && units !== demo.get('Units')) differing.push(`${id}: ${units}`);
      const goal = person.get('Water goal') ?? '';
      // The goal in force is the suggestion (or none, where the health check withholds it) unless the story is about a goal of their own.
      if (!about.includes('waterGoal') && (goal === 'Off' || goal.endsWith(', their own'))) differing.push(`${id}: water goal ${goal}`);
    }
    expect(differing).toEqual([]);
  });

  it('declares a subject only where its person differs in it', async () => {
    const demo = await factsOf(demoScenario);
    const idle: string[] = [];
    for (const { id, scenario, about } of stories) {
      const person = await factsOf(scenario);
      if (about.includes('units') && person.get('Units') === demo.get('Units')) idle.push(`${id}: about units, yet ${person.get('Units')}`);
      if (about.includes('waterGoal') && (person.get('Water goal') ?? '').endsWith(', suggested')) idle.push(`${id}: about the water goal, yet suggested`);
    }
    expect(idle).toEqual([]);
  });
});
