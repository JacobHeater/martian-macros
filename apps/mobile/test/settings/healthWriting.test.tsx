import { screen, within } from '@testing-library/react';
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
 * MM-70, MM-314, MM-513, MM-489: writing to Health Connect is turned on in
 * Settings, one kind at a time, each asking for its own permission and
 * never with reading; refused, it stays off and says so. Turned off, it
 * asks whether to keep or remove what was written (MM-514).
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
  for (const name of [/Send food you log/, /Send water you log/, /Send weight you type/, /Send workouts you finish/]) {
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

it('turning weight on asks for weight alone (MM-513)', async () => {
  const settings = await open();
  await userEvent.click(await settings.findByRole('switch', { name: /Send weight you type to Health Connect/ }));
  expect(await screen.findByText('Weight you type from now on is sent to Health Connect.')).toBeInTheDocument();
  expect([...writing.asked.keys()]).toEqual(['weight']);
  expect(await writing.writing()).toEqual(new Set(['weight']));
});

it('Kept: turned off and "Keep" chosen, nothing more is written, and what was written stays (MM-514)', async () => {
  writing = new InMemoryHealthWriting({ on: ['workouts', 'food'] });
  await writing.writeNutrition({
    id: 'martian-macros-food-ns1-1',
    start: new Date(2026, 9, 5, 12, 30),
    end: new Date(2026, 9, 5, 13, 0),
    kcal: 510,
    proteinG: 40,
    carbsG: 50,
    fatG: 15,
  });
  const settings = await open();
  const food = await settings.findByRole('switch', { name: /Send food you log to Health Connect/ });
  expect(food).toBeChecked();
  await userEvent.click(food);
  const dialog = await screen.findByRole('dialog', { name: 'Remove the food already sent?' });
  const keep = within(dialog).getByRole('button', { name: 'Keep' });
  const remove = within(dialog).getByRole('button', { name: 'Remove' });
  // Keeping is the first answer, and the safe one.
  expect(keep.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await userEvent.click(keep);
  expect(
    await screen.findByText('Sending food you log to Health Connect is off. What was sent stays there.'),
  ).toBeInTheDocument();
  expect(await writing.writing()).toEqual(new Set(['workouts']));
  expect(writing.nutrition.size).toBe(1);
});

it('Removed: turned off and "Remove" chosen, the app’s food is gone and its water is not (MM-514)', async () => {
  writing = new InMemoryHealthWriting({ on: ['food', 'water'] });
  await writing.writeNutrition({
    id: 'martian-macros-food-ns1-1',
    start: new Date(2026, 9, 5, 12, 30),
    end: new Date(2026, 9, 5, 13, 0),
    kcal: 510,
    proteinG: 40,
    carbsG: 50,
    fatG: 15,
  });
  await writing.writeWater({ id: 'martian-macros-water-ns1-1', at: new Date(2026, 9, 5, 9, 0), ml: 250 });
  const settings = await open();
  await userEvent.click(await settings.findByRole('switch', { name: /Send food you log to Health Connect/ }));
  const dialog = await screen.findByRole('dialog', { name: 'Remove the food already sent?' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
  expect(
    await screen.findByText('Sending food you log to Health Connect is off. What was sent is removed from Health Connect.'),
  ).toBeInTheDocument();
  expect(writing.nutrition.size).toBe(0);
  expect(writing.water.size).toBe(1);
  expect(await writing.writing()).toEqual(new Set(['water']));
});

it('a removal the platform does not make says so, and where to do it (MM-514)', async () => {
  writing = new InMemoryHealthWriting({ on: ['workouts'] });
  writing.removeWritten = () => Promise.resolve(false);
  const settings = await open();
  await userEvent.click(await settings.findByRole('switch', { name: /Send workouts you finish to Health Connect/ }));
  const dialog = await screen.findByRole('dialog', { name: 'Remove the workouts already sent?' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
  expect(
    await screen.findByText(
      'Sending workouts you finish to Health Connect is off. What was sent could not be removed. You can remove it in Health Connect.',
    ),
  ).toBeInTheDocument();
});
