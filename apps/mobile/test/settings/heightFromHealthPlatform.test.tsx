import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { HealthImporter } from '../../src/healthIngest/HealthImporter';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { expectClose } from '../support/expectClose';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';

/**
 * MM-68: a height read from the health platform is offered as a suggestion
 * when it differs from the profile's, and never overwrites it silently.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  // 180 cm, shown as 5′ 11″.
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
});

/** Heights the platform holds, in centimetres, one a day, the last today. */
async function platformHeights(...cms: number[]): Promise<void> {
  const events = cms.map(
    (cm, i) =>
      `{"op": "add", "type": "height", "id": "h-${i}", "value": ${cm}, "start": "${today.addDays(i - cms.length + 1).toString()}T07:00:00", "source": "scale"}`,
  );
  const source = FakeHealthSource.fromJson(`{"sources": [{"id": "scale", "name": "Smart scale"}], "events": [${events.join(',')}]}`);
  await source.permit(new Set(['height']));
  await new HealthImporter({ source, store: repos.healthSamples }).import('height');
}

const setup = async () => {
  const stored = await repos.setup.loadSetup();
  if (stored === undefined) throw new Error('No setup is stored.');
  return stored;
};

it('a different height is offered under the row, and saved only when chosen', async () => {
  await platformHeights(181, 176);
  renderApp(repos, today);
  const settings = await openSettings();
  // The newest reading is the one offered.
  expect(await settings.findByText('Health Connect says 5′ 9″')).toBeInTheDocument();
  expect((await setup()).profile.heightCm).toBe(180);

  await userEvent.click(settings.getByRole('button', { name: /^Height/ }));
  const sheet = within(await screen.findByRole('dialog', { name: 'Height' }));
  expect(sheet.getByText(/Health Connect has 5′ 9″/)).toBeInTheDocument();
  // Still the profile's until the suggestion is chosen.
  expect(sheet.getByRole<HTMLInputElement>('textbox', { name: 'Inches' }).value).toBe('11');
  await userEvent.click(sheet.getByRole('button', { name: 'Use 5′ 9″' }));
  expect(sheet.getByRole<HTMLInputElement>('textbox', { name: 'Feet' }).value).toBe('5');
  expect(sheet.getByRole<HTMLInputElement>('textbox', { name: 'Inches' }).value).toBe('9');
  expect((await setup()).profile.heightCm).toBe(180);

  await userEvent.click(sheet.getByRole('button', { name: 'Save' }));
  await expect.poll(async () => (await setup()).profileRevision).toBe(1);
  expectClose((await setup()).profile.heightCm, 175.26, 0.1);
  // Now they agree, so nothing is offered.
  await expect.poll(() => settings.queryByText(/Health Connect says/)).toBeNull();
});

it('a height that shows the same as the profile is not offered', async () => {
  await platformHeights(180.3);
  renderApp(repos, today);
  const settings = await openSettings();
  await settings.findByText('5′ 11″');
  expect(settings.queryByText(/Health Connect says/)).toBeNull();
});

it('with no height read, nothing is offered', async () => {
  renderApp(repos, today);
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Height/ }));
  const sheet = within(await screen.findByRole('dialog', { name: 'Height' }));
  expect(sheet.queryByRole('button', { name: /^Use / })).toBeNull();
});
