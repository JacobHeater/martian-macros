import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { importedWeighInText } from '../../src/format/importedWeighInText';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';
import { rules } from '../support/stylesheetRules';

/**
 * MM-395: steps the phone counted itself came with no app name, so Settings
 * said "28 readings from com.android.healthconnect.phone.j07164f9d…", one
 * word too long to wrap, running out of the card.
 */
const today = CalendarDate.of(2026, 10, 5);
const phone = 'com.android.healthconnect.phone.j07164f9d1f553234a69c64d';
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
});

const steps = (sources: string) =>
  FakeHealthSource.fromJson(`{"sources": [${sources}], "events": [
    {"op": "add", "type": "steps", "id": "s1", "value": 900, "start": "2026-10-04T09:00:00", "end": "2026-10-04T10:00:00", "source": "${phone}"},
    {"op": "add", "type": "steps", "id": "s2", "value": 1200, "start": "2026-10-04T11:00:00", "end": "2026-10-04T12:00:00", "source": "${phone}"}
  ]}`);

it('readings from a source with no name say how many, never the package', async () => {
  const source = steps('');
  renderApp(repos, today, { change: (services) => ({ ...services, healthSource: source }) });
  const settings = await openSettings();
  await userEvent.click(await settings.findByRole('button', { name: /^Steps/ }));
  const row = () => settings.getByText('Steps').closest('.mm-list-row');
  await expect.poll(() => row()?.textContent ?? '').toContain('Allowed. 2 readings.');
  expect(row()?.textContent).not.toContain('com.android');
});

it('a weigh-in from a source with no name says Health Connect, never the package', () => {
  const weighIn = { day: new Date(2026, 9, 4), kg: 82, readings: 1, basis: 'medianOfDay' as const, sourceName: '' };
  expect(importedWeighInText(weighIn, 'android')).toBe('From Health Connect.');
  expect(importedWeighInText({ ...weighIn, readings: 3 }, 'android')).toBe('The middle of 3 readings from Health Connect.');
  // On an iPhone the platform is named by its own name (MM-69).
  expect(importedWeighInText(weighIn, 'ios')).toBe('From Apple Health.');
});

it('a list row breaks a word too long for its line', () => {
  const css = readFileSync(join(__dirname, '../../src/ui/ui.css'), 'utf8');
  const text = rules(css).find((rule) => rule.selectors.includes('.mm-list-row-text'));
  expect(text?.body).toMatch(/overflow-wrap:\s*anywhere/);
});
