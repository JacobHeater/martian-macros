import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { AppState } from '../../src/state/AppState';
import { first } from '../support/first';
import { servicesOf } from '../support/servicesOf';

const today = CalendarDate.of(2026, 10, 10);

/** MM-360: the water goal on Food never makes the coach be worked out, as it did while it read the trend weight. */
it('watching the water goal leaves the coach unwatched', async () => {
  const repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 84);
  const state = new AppState(servicesOf(repos, new FixedClock(today)));
  const stop = state.waterGoal.subscribe(() => undefined);
  await first(repos.weights.watchWeights());
  expect(state.waterGoal.peek()).toBeDefined();
  expect(state.coach.watched).toBe(false);
  stop();
});
