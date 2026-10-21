import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { HealthImporter } from '../../src/healthIngest/HealthImporter';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { AppState } from '../../src/state/AppState';
import { Loadable } from '../../src/state/Loadable';
import { servicesOf } from '../support/servicesOf';

/**
 * MM-68: menstruation read from the health platform feeds the trend's noise
 * (MM-19), as days marked in the app do; the Period days card still marks
 * only what was marked in the app.
 */
const today = CalendarDate.of(2026, 10, 21);

it('days of flow read from the platform join the marked ones for the trend', async () => {
  const repos = new InMemoryRepositories();
  await repos.flowDays.markFlowDay(today.addDays(-9));
  const source = FakeHealthSource.fromJson(
    JSON.stringify({
      sources: [{ id: 'tracker', name: 'Cycle tracker' }],
      events: [3, 2].map((ago) => ({
        op: 'add',
        type: 'menstruation',
        id: `m-${ago}`,
        value: 1,
        start: `${today.addDays(-ago).toString()}T08:00:00`,
        source: 'tracker',
      })),
    }),
  );
  await source.permit(new Set(['menstruation']));
  await new HealthImporter({ source, store: repos.healthSamples }).import('menstruation');

  const state = new AppState(servicesOf(repos, new FixedClock(today)));
  const stops = [state.flowDays.subscribe(() => undefined), state.typedFlowDays.subscribe(() => undefined)];
  await expect
    .poll(() => (Loadable.valueOf(state.flowDays.peek()) ?? []).map((d) => d.date))
    .toEqual([today.addDays(-9), today.addDays(-3), today.addDays(-2)]);
  expect((Loadable.valueOf(state.typedFlowDays.peek()) ?? []).map((d) => d.date)).toEqual([today.addDays(-9)]);
  for (const stop of stops) stop();
});
