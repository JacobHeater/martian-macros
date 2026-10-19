import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { HealthDataType } from '../../src/healthIngest/HealthDataType';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { recordedHealthHistory } from '../../src/healthIngest/testing/recordedHealthHistory';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';

/**
 * MM-69: the same section on an iPhone, where the platform is Apple Health
 * and never tells the app that reading a kind was refused. A kind asked for
 * counts as connected; its row says what was read, or that nothing was
 * found yet and where to check. "Not allowed" is never claimed.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let source: FakeHealthSource;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  source = FakeHealthSource.fromJson(recordedHealthHistory, { happened: 9 });
});

async function open({ withSource = true }: { withSource?: boolean } = {}) {
  renderApp(repos, today, {
    change: (services) => ({ ...services, platform: 'ios', ...(withSource ? { healthSource: source } : {}) }),
  });
  return openSettings();
}

type Settings = Awaited<ReturnType<typeof open>>;
const row = (settings: Settings, title: string) => settings.getByText(title).closest('.mm-list-row');
const stored = (type: HealthDataType) => repos.healthSamples.samples(type);

it('a device without Apple Health says so, by its name', async () => {
  const settings = await open({ withSource: false });
  expect(await settings.findByText('Apple Health is not on this phone')).toBeInTheDocument();
  expect(settings.queryByText(/Health Connect/)).not.toBeInTheDocument();
});

it('each kind is offered as not asked yet, never as not allowed', async () => {
  const settings = await open();
  await settings.findByText('Weight');
  expect(row(settings, 'Weight')).toHaveTextContent('Not asked yet. Weigh-ins from your scale, so you need not type them.');
  expect(settings.queryByText(/Not allowed/)).not.toBeInTheDocument();
  expect(settings.queryByText(/Health Connect/)).not.toBeInTheDocument();
});

it('a kind asked for and read says how many readings, and the read-now row names Apple Health', async () => {
  const settings = await open();
  await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
  await expect.poll(async () => (await stored('weight')).length).toBe(5);
  expect(await screen.findByText('Weight read from Apple Health.')).toBeInTheDocument();
  expect(row(settings, 'Weight')).toHaveTextContent(/5 readings from/);
  expect(row(settings, 'Weight')).not.toHaveTextContent(/Allowed/);
  expect(settings.getByRole('button', { name: 'Read from Apple Health now' })).toBeInTheDocument();
});

it('a kind asked for with nothing found says so and where to check, since Apple Health never says it was refused', async () => {
  // Weight is on the platform with nothing in it: a reading added and deleted, as the story device does.
  source = FakeHealthSource.fromJson(
    '{"sources": [{"id": "scale", "name": "Bathroom scale"}], "events": [' +
      '{"op": "add", "type": "weight", "id": "w-gone", "value": 82, "start": "2026-10-04T07:05:00", "source": "scale"},' +
      '{"op": "delete", "type": "weight", "id": "w-gone"}]}',
  );
  const settings = await open();
  await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
  expect(await screen.findByText(/Nothing found in Apple Health for Weight yet/)).toBeInTheDocument();
  expect(row(settings, 'Weight')).toHaveTextContent(
    'Nothing found in Apple Health yet. To allow it, or to check, open Settings, Health, Data Access & Devices.',
  );
  expect(screen.queryByText(/was not allowed/)).not.toBeInTheDocument();
});

it('the note says where to stop sharing, by the route Apple documents, in the same words as the rows', async () => {
  const settings = await open();
  await settings.findByText('Weight');
  expect(settings.getByText(/take the permission away in Settings, Health, Data Access & Devices/)).toBeInTheDocument();
  expect(settings.queryByText(/Sharing, Apps/)).not.toBeInTheDocument();
});

it('reading now says everything asked for is up to date, never everything allowed (the panel\'s F3)', async () => {
  await source.permit(new Set<HealthDataType>(['weight']));
  const settings = await open();
  await userEvent.click(await settings.findByRole('button', { name: 'Read from Apple Health now' }));
  expect(await screen.findByText('Read from Apple Health. Everything asked for is up to date.')).toBeInTheDocument();
  expect(screen.queryByText(/Everything allowed/)).not.toBeInTheDocument();
});

it('folds like every other section of Settings, closed until opened (MM-407)', async () => {
  renderApp(repos, today, { change: (services) => ({ ...services, platform: 'ios', healthSource: source }) });
  const settings = await openSettings({ closed: true });
  const header = await settings.findByRole('button', { name: /^Apple Health/ });
  expect(header).toHaveAttribute('aria-expanded', 'false');
  expect(settings.queryByText('Weight')).not.toBeVisible();
});
