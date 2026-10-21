import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryHealthWriting } from '../../src/fixtures/InMemoryHealthWriting';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { recordedHealthHistory } from '../../src/healthIngest/testing/recordedHealthHistory';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';

/**
 * MM-70, MM-314, MM-489: writing to Health Connect is turned on in Settings,
 * one kind at a time, each asking for its own permission and never with
 * reading; refused, it stays off and says so.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let source: FakeHealthSource;
let writing: InMemoryHealthWriting;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  source = FakeHealthSource.fromJson(recordedHealthHistory, { happened: 9 });
  writing = new InMemoryHealthWriting();
});

async function open() {
  renderApp(repos, today, { change: (services) => ({ ...services, healthSource: source, healthWriting: writing }) });
  return openSettings();
}

it('every kind is off at first, and nothing is asked before a switch is turned on', async () => {
  const settings = await open();
  for (const name of [/Send food you log/, /Send water you log/, /Send workouts you finish/]) {
    expect(await settings.findByRole('switch', { name })).not.toBeChecked();
  }
  expect(writing.asked.size).toBe(0);
});

it('turning food on asks for food alone, and reading is not asked for', async () => {
  const settings = await open();
  await userEvent.click(await settings.findByRole('switch', { name: /Send food you log to Health Connect/ }));
  expect(await screen.findByText('Food you log from now on is sent to Health Connect.')).toBeInTheDocument();
  expect(settings.getByRole('switch', { name: /Send food you log to Health Connect/ })).toBeChecked();
  expect([...writing.asked.keys()]).toEqual(['food']);
  expect(await writing.writing()).toEqual(new Set(['food']));
  expect((await source.permitted()).size).toBe(0);
});

it('refused, a switch stays off and says so', async () => {
  writing.willPermit = new Set(['food', 'workouts']);
  const settings = await open();
  await userEvent.click(await settings.findByRole('switch', { name: /Send water you log to Health Connect/ }));
  expect(
    await screen.findByText(
      'Sending to Health Connect was not allowed, so nothing is sent. You can allow it here, or in Health Connect.',
    ),
  ).toBeInTheDocument();
  expect(settings.getByRole('switch', { name: /Send water you log to Health Connect/ })).not.toBeChecked();
});

it('turned off, nothing more is written, and what was written stays', async () => {
  writing = new InMemoryHealthWriting({ on: ['workouts'] });
  const settings = await open();
  const workouts = await settings.findByRole('switch', { name: /Send workouts you finish to Health Connect/ });
  expect(workouts).toBeChecked();
  await userEvent.click(workouts);
  expect(
    await screen.findByText('Sending workouts you finish to Health Connect is off. What was sent stays there.'),
  ).toBeInTheDocument();
  expect(await writing.writing()).toEqual(new Set());
});
