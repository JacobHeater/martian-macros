import { describe, expect, it } from 'vitest';
import { seedDemo } from '../../src/app/seedDemo';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { first } from '../support/first';
import { servicesOf } from '../support/servicesOf';

/**
 * MM-177: a build made by `mm demo --seed` starts from the demo scenario on
 * every launch, inside the shell only; every other build is never seeded.
 */
const today = CalendarDate.of(2026, 10, 13);

async function counts(repos: InMemoryRepositories) {
  const weights = await first(repos.weights.watchWeights());
  const setup = await first(repos.setup.watchSetup());
  const food = await first(repos.food.watchFood(today));
  return { setup: setup === undefined ? 0 : 1, weights: weights.length, foodToday: food.length };
}

describe('seedDemo', () => {
  it('seeds the demo scenario, anchored to today, when asked inside the shell', async () => {
    const repos = new InMemoryRepositories();
    const seeded = await seedDemo({ services: servicesOf(repos, new FixedClock(today)), asked: true, native: true });
    expect(seeded).toBe(true);
    expect(await counts(repos)).toEqual({ setup: 1, weights: DemoSeed.historyDays + 1, foodToday: 1 });
    const weights = await first(repos.weights.watchWeights());
    expect(weights.at(-1)?.date.daysUntil(today)).toBe(0);
  });

  it('seeding again replaces, so nothing accumulates', async () => {
    const repos = new InMemoryRepositories();
    const services = servicesOf(repos, new FixedClock(today));
    await seedDemo({ services, asked: true, native: true });
    const once = await counts(repos);
    await seedDemo({ services, asked: true, native: true });
    expect(await counts(repos)).toEqual(once);
  });

  it('a build that was not asked, or a browser, is never seeded', async () => {
    for (const [asked, native] of [
      [false, true],
      [true, false],
      [false, false],
    ] as const) {
      const repos = new InMemoryRepositories();
      const seeded = await seedDemo({ services: servicesOf(repos, new FixedClock(today)), asked, native });
      expect(seeded).toBe(false);
      expect(await counts(repos)).toEqual({ setup: 0, weights: 0, foodToday: 0 });
    }
  });
});
