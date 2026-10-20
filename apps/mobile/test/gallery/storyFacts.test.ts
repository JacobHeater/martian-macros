import { expect, it } from 'vitest';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { storyFacts } from '../../src/gallery/screens/storyFacts';
import { storyToday } from '../../src/gallery/screens/storyToday';
import { targetsFrom } from '../support/targetsFrom';

const as = { stores: false, device: false };

/** MM-356: the "Person" panel says who a story's person is, from what its scenario stored. */
it('the water goal is said as in force: suggested, their own, or off (MM-358)', async () => {
  const repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: storyToday.addDays(-10), healthCheckConfirmedOn: storyToday }));
  await repos.targets.saveTargets(targetsFrom(storyToday.addDays(-10), { kcal: 2200 }));
  const off = new Map(await storyFacts(repos, storyToday, as));
  expect(off.get('Water goal')).toMatch(/, suggested$/);
  expect(off.get('Started')).toBe('10 days ago');
  await repos.preferences.saveWaterGoal(2000);
  expect(new Map(await storyFacts(repos, storyToday, as)).get('Water goal')).toMatch(/, their own$/);
  await repos.preferences.saveWaterGoalOff(true);
  expect(new Map(await storyFacts(repos, storyToday, as)).get('Water goal')).toBe('Off');
});

it('a new installation and a story that alters storage are said as such', async () => {
  const facts = new Map(await storyFacts(new InMemoryRepositories(), storyToday, { stores: true, device: false }));
  expect(facts.get('Person')).toBe('A new installation: nothing stored');
  expect(facts.get('Storage')).toMatch(/^Altered by this story/);
});

/** MM-422: before any targets are stored the coach issues the first on opening, so no amount is claimed without them. */
it('with no targets stored, the suggested goal names no amount the screen would contradict (MM-422)', async () => {
  const repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: storyToday, healthCheckConfirmedOn: storyToday }));
  await repos.weights.saveWeight(storyToday, 86);
  const facts = new Map(await storyFacts(repos, storyToday, as));
  expect(facts.get('Water goal')).toBe('Suggested, from the targets the coach issues on opening');
  expect(facts.get('Water goal')).not.toMatch(/fl oz/);
});
