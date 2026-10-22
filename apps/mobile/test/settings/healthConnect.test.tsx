import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { BiologicalSex } from '../../src/domain/BiologicalSex';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { HealthDataType } from '../../src/healthIngest/HealthDataType';
import { HealthImporter } from '../../src/healthIngest/HealthImporter';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { recordedHealthHistory } from '../../src/healthIngest/testing/recordedHealthHistory';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-68: connecting Health Connect from Settings, one kind of reading at a
 * time. Carried over from health_connect_section_test.dart, with the cases
 * of imported_weigh_ins_test.dart that read the platform as the app opens
 * and health_import_test.dart.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let source: FakeHealthSource;

async function setUpUser(sex: BiologicalSex = 'male'): Promise<void> {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), sex, healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
}

beforeEach(async () => {
  await setUpUser();
  source = FakeHealthSource.fromJson(recordedHealthHistory, { happened: 9 });
});

async function open({ withSource = true }: { withSource?: boolean } = {}) {
  renderApp(repos, today, withSource ? { change: (services) => ({ ...services, healthSource: source }) } : {});
  return openSettings();
}

type Settings = Awaited<ReturnType<typeof open>>;
const row = (settings: Settings, title: string) => settings.getByText(title).closest('.mm-list-row');
const stored = (type: HealthDataType) => repos.healthSamples.samples(type);
const readNow = (settings: Settings) =>
  userEvent.click(settings.getByRole('button', { name: 'Read from Health Connect now' }));

it('a phone without Health Connect says so and offers nothing', async () => {
  const settings = await open({ withSource: false });
  expect(await settings.findByText(/Health Connect is not on this phone/)).toBeInTheDocument();
  expect(settings.queryByText('Weight')).not.toBeInTheDocument();
  expect(settings.queryByRole('button', { name: 'Read from Health Connect now' })).not.toBeInTheDocument();
});

it('each kind is offered with what it is for, and nothing is read before it is allowed', async () => {
  const settings = await open();
  await settings.findByText('Weight');
  expect(row(settings, 'Weight')).toHaveTextContent(
    'Not allowed. Weigh-ins from your scale, so you need not type them.',
  );
  expect(await stored('weight')).toEqual([]);
  expect(settings.queryByRole('button', { name: 'Read from Health Connect now' })).not.toBeInTheDocument();
});

it('allowing weight imports it, with where it came from, and leaves the other kinds alone', async () => {
  const settings = await open();
  await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
  await expect.poll(async () => (await stored('weight')).length).toBe(5);
  await expect
    .poll(() => row(settings, 'Weight')?.textContent ?? '')
    .toContain('Allowed. 5 readings from Bathroom scale, Health app, typed.');
  expect(row(settings, 'Body fat')).toHaveTextContent('Not allowed.');
  expect(await stored('bodyFat')).toEqual([]);
  expect(await source.permitted()).toEqual(new Set(['weight']));
  // What the user typed is not touched by an import.
  const typed = await first(repos.weights.watchWeights());
  expect(typed).toHaveLength(1);
  expect(typed[0]?.weightKg).toBe(82);
});

it('refusing a kind leaves it not allowed and says how to allow it later', async () => {
  source.willPermit = new Set();
  const settings = await open();
  await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
  expect(await screen.findByText(/Weight was not allowed\./)).toBeInTheDocument();
  expect(row(settings, 'Weight')).toHaveTextContent('Not allowed.');
  expect(await stored('weight')).toEqual([]);
});

it('once Health Connect stops asking for a kind, it says to allow it there and opens it (MM-323)', async () => {
  source.stopsAsking = new Set<HealthDataType>(['weight']);
  const settings = await open();
  await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
  expect(await screen.findByText('Health Connect no longer asks for weight here. You can allow it in Health Connect instead.')).toBeInTheDocument();
  // Not "You can allow it here": that would send the person round in a circle.
  expect(screen.queryByText(/You can allow it here/)).not.toBeInTheDocument();
  // The person allows weight on Health Connect's own page.
  source.allowsThere = new Set<HealthDataType>(['weight']);
  await userEvent.click(screen.getByRole('button', { name: 'Open Health Connect' }));
  await expect.poll(() => source.permissionsOpened).toBe(1);
  // Coming back, what is allowed now is read: the row says so, the readings are kept, and a snack says it.
  expect(await screen.findByText('Weight allowed.')).toBeInTheDocument();
  await expect.poll(() => row(settings, 'Weight')?.textContent ?? '').toContain('Allowed.');
  await expect.poll(async () => (await stored('weight')).length).toBe(5);
});

it('back from Health Connect with nothing allowed there, it says nothing changed and still offers the kind (MM-323)', async () => {
  source.stopsAsking = new Set<HealthDataType>(['weight']);
  const settings = await open();
  await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Open Health Connect' }));
  expect(await screen.findByText('Nothing changed.')).toBeInTheDocument();
  expect(row(settings, 'Weight')).toHaveTextContent('Not allowed.');
  expect(await stored('weight')).toEqual([]);
});

it('where Health Connect cannot be opened, it says where to allow the kind instead (MM-323)', async () => {
  source.stopsAsking = new Set<HealthDataType>(['weight']);
  source.opensPermissions = false;
  const settings = await open();
  await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Open Health Connect' }));
  expect(
    await screen.findByText('Health Connect could not be opened from here. You can allow it in Health Connect, from your phone’s settings.'),
  ).toBeInTheDocument();
});

it('reading again brings an edit and a deletion made since', async () => {
  const settings = await open();
  await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
  await settings.findByRole('button', { name: 'Read from Health Connect now' });
  await expect.poll(async () => (await stored('weight')).length).toBe(5);
  source.letAllHappen();
  await readNow(settings);
  await expect.poll(async () => (await stored('weight')).map((s) => s.platformId)).toEqual(['w-1', 'w-3', 'w-4', 'w-5', 'w-6']);
  expect((await stored('weight'))[1]?.value).toBe(82.4);
});

it('when Health Connect cannot be read, it says so and nothing kept is changed', async () => {
  const settings = await open();
  await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
  await settings.findByRole('button', { name: 'Read from Health Connect now' });
  await expect.poll(async () => (await stored('weight')).length).toBe(5);
  const before = await stored('weight');
  source.letAllHappen();
  source.expireTokens();
  source.unreadable = true;
  await readNow(settings);
  expect(
    await screen.findByText('Health Connect could not be read just now. Nothing was changed.'),
  ).toBeInTheDocument();
  expect(await stored('weight')).toEqual(before);
});

describe('laid out as Reminders is (MM-320)', () => {
  it('is its own section: rows in the card, the note under it, Read now a row', async () => {
    await source.permit(new Set(['weight']));
    const settings = await open();
    const section = (await settings.findByRole('region', { name: 'Health Connect' })) as HTMLElement;
    const card = section.querySelector('.mm-list-group')!;
    const note = within(section).getByText(/^Nothing read leaves this phone/);
    expect(card.contains(note)).toBe(false);
    expect([...card.children].every((child) => child.classList.contains('mm-list-row'))).toBe(true);
    expect(within(card as HTMLElement).getByRole('button', { name: 'Read from Health Connect now' })).toBeInTheDocument();
    const data = settings.getByRole('region', { name: 'Data' });
    expect(within(data).queryByText('Weight')).not.toBeInTheDocument();
  });

  it('allowing a kind says so, since its row stops being a button', async () => {
    const settings = await open();
    await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
    expect(await screen.findByText('Weight allowed.')).toBeInTheDocument();
  });

  it('allowing a kind whose first read fails still says it was allowed', async () => {
    source.unreadable = true;
    const settings = await open();
    await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
    expect(
      await screen.findByText('Weight allowed, but Health Connect could not be read just now. Nothing was changed.'),
    ).toBeInTheDocument();
  });

  it('reading now says when it is done', async () => {
    await source.permit(new Set(['weight']));
    const settings = await open();
    await settings.findByRole('button', { name: 'Read from Health Connect now' });
    await readNow(settings);
    expect(await screen.findByText(/^Read from Health Connect\. Everything allowed is up to date\./)).toBeInTheDocument();
  });

  it('an allowed kind is not heard as "Allowed" twice', async () => {
    await source.permit(new Set(['weight']));
    const settings = await open();
    await expect.poll(() => row(settings, 'Weight')?.textContent ?? '').toContain('Allowed.');
    expect(within(row(settings, 'Weight') as HTMLElement).queryByRole('img', { name: 'Allowed' })).toBeNull();
  });
});

it('a permission taken away later is noticed, and what was read is kept', async () => {
  await source.permit(new Set(['weight']));
  const settings = await open();
  await readNow(await (async () => (await settings.findByRole('button', { name: 'Read from Health Connect now' }), settings))());
  await expect.poll(() => row(settings, 'Weight')?.textContent ?? '').toContain('Allowed.');
  source.revoke();
  await readNow(settings);
  await expect.poll(() => row(settings, 'Weight')?.textContent ?? '').toContain('Not allowed.');
  expect(await stored('weight')).toHaveLength(5);
});

describe('menstruation', () => {
  const withCycle = `
{"sources": [{"id": "app", "name": "Cycle app"}],
 "events": [
  {"op": "add", "type": "weight", "id": "w", "value": 60, "start": "2026-09-01T07:00:00", "source": "app"},
  {"op": "add", "type": "menstruation", "id": "m", "value": 1, "start": "2026-09-01T00:00:00", "source": "app"}
 ]}`;

  it('is offered to a female profile', async () => {
    await setUpUser('female');
    source = FakeHealthSource.fromJson(withCycle);
    const settings = await open();
    await settings.findByText('Weight');
    expect(settings.getByText(/To allow for water weight around your period\./)).toBeInTheDocument();
  });

  it('is not offered to a male profile', async () => {
    source = FakeHealthSource.fromJson(withCycle);
    const settings = await open();
    await settings.findByText('Weight');
    expect(settings.queryByText(/To allow for water weight around your period\./)).not.toBeInTheDocument();
  });
});

/** MM-67, from health_import_test.dart. */
it('importing fills the store once, and erasing empties it', async () => {
  const everything = FakeHealthSource.fromJson(recordedHealthHistory);
  await everything.permit();
  const importer = new HealthImporter({ source: everything, store: repos.healthSamples });
  await importer.import('weight');
  await importer.import('weight');
  expect(await stored('weight')).toHaveLength(5);
  await repos.eraser.eraseAll();
  expect(await stored('weight')).toEqual([]);
  expect(await repos.healthSamples.token('weight')).toBeUndefined();
});

/** MM-68 and MM-71, from imported_weigh_ins_test.dart: the health platform is read as the app opens. */
describe('opening the app', () => {
  const two = (value: number) => String(value).padStart(2, '0');
  const iso = (date: CalendarDate) => `${date.year}-${two(date.month)}-${two(date.day)}`;

  /** A scale that weighed every morning for ten days up to today. */
  function scaleHistory(): string {
    const events: string[] = [];
    for (let d = 9; d >= 0; d--) {
      events.push(
        `{"op": "add", "type": "weight", "id": "w-${d}", "value": ${d === 0 ? 81.4 : 82 + d * 0.05}, ` +
          `"start": "${iso(today.addDays(-d))}T06:42:00", "source": "scale"}`,
      );
    }
    return `{"sources": [{"id": "scale", "name": "Bathroom scale"}], "events": [${events.join(',')}]}`;
  }

  beforeEach(async () => {
    repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await repos.setup.saveSetup(
      typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }),
    );
    source = FakeHealthSource.fromJson(scaleHistory());
    await source.permit(new Set(['weight']));
  });

  async function openProgress(): Promise<HTMLInputElement> {
    renderApp(repos, today, { change: (services) => ({ ...services, healthSource: source }) });
    await openTab('Progress');
    return screen.findByRole<HTMLInputElement>('textbox', { name: 'Today’s weigh-in' });
  }

  it('reads the scale: today’s weigh-in is its morning reading, and nothing is written among what was typed', async () => {
    const weighIn = await openProgress();
    await expect.poll(() => weighIn.isConnected && screen.getByRole<HTMLInputElement>('textbox', { name: 'Today’s weigh-in' }).value).toBe('81.4');
    expect(screen.getByText('From Bathroom scale at 6:42 AM. Type a value to use yours instead.')).toBeInTheDocument();
    expect(await stored('weight')).toHaveLength(10);
    expect(await first(repos.weights.watchWeights())).toEqual([]);
  });

  it('when the scale cannot be read on opening, what was kept is still used', async () => {
    await new HealthImporter({ source, store: repos.healthSamples }).import('weight');
    source.unreadable = true;
    await openProgress();
    await expect.poll(() => screen.getByRole<HTMLInputElement>('textbox', { name: 'Today’s weigh-in' }).value).toBe('81.4');
  });

  it('with nothing allowed, nothing is read and nothing changes', async () => {
    source.revoke();
    const weighIn = await openProgress();
    expect(weighIn).toHaveValue('');
    expect(screen.getByText('First thing in the morning, after the bathroom.')).toBeInTheDocument();
    expect(await stored('weight')).toEqual([]);
  });
});
