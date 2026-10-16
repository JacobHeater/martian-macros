import { expect, it } from 'vitest';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { storyFacts } from '../../src/gallery/screens/storyFacts';
import { storyToday } from '../../src/gallery/screens/storyToday';

const as = { stores: false, device: false };

/** MM-356: the "Person" panel says who a story's person is, from what its scenario stored. */
it('the water goal is said as in force: suggested, their own, or off (MM-358)', async () => {
  const repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: storyToday.addDays(-10), healthCheckConfirmedOn: storyToday }));
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
