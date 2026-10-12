import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-155: a waist entry of three readings, or of one. Carried over from waist_entry_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

const metric = () =>
  typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' });

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(metric());
  await repos.weights.saveWeight(today, 82);
});

let card: HTMLElement;

async function openWaist(): Promise<void> {
  renderApp(repos, today);
  await openTab('Progress');
  card = (await screen.findByRole('heading', { name: 'Waist' })).closest('.mm-surface') as HTMLElement;
}

const fields = ['1st waist reading', '2nd waist reading', '3rd waist reading'];
const field = (i: number) => screen.getByRole<HTMLInputElement>('textbox', { name: fields[i] as string });

async function type(readings: readonly string[]): Promise<void> {
  for (const [i, reading] of readings.entries()) {
    await userEvent.clear(field(i));
    await userEvent.type(field(i), reading);
  }
}

const saveButton = () => card.querySelector<HTMLButtonElement>('.progress-waist-save button') as HTMLButtonElement;
const canSave = () => !saveButton().disabled;
const note = () => card.querySelector('.progress-waist-note')?.textContent ?? '';
const stored = () => first(repos.waist.watchWaist());

async function save(): Promise<void> {
  await userEvent.click(saveButton());
}

it('three readings: the middle one is the measurement, and all three are kept', async () => {
  await openWaist();
  expect(note()).toBe('Take three readings in centimeters. The middle one is kept.');
  await type(['91.5', '92.5', '92.0']);
  await save();
  await expect.poll(async () => (await stored()).length).toBe(1);
  const entry = (await stored())[0];
  expect(entry?.date).toBe(today);
  expect(entry?.waistCm).toBe(92.0);
  expect(entry?.readings).toEqual([91.5, 92.5, 92.0]);
  expect(await screen.findByText(/Latest: 92 cm on Oct 5\./)).toBeInTheDocument();
});

it('one reading is a quick entry, recorded as one, and says what that costs', async () => {
  await openWaist();
  await type(['92.4']);
  expect(note()).toContain('It is noisier than the middle of three');
  await save();
  await expect.poll(async () => (await stored()).length).toBe(1);
  const entry = (await stored())[0];
  expect(entry?.waistCm).toBe(92.4);
  expect(entry?.readings).toEqual([92.4]);
  expect(entry?.isSingleReading).toBe(true);
});

it('two readings are neither: nothing can be saved', async () => {
  await openWaist();
  await type(['92.4', '92.0']);
  expect(note()).toBe('Enter one reading or all three.');
  expect(canSave()).toBe(false);
  await type(['92.4', '92.0', '91.8']);
  expect(canSave()).toBe(true);
});

it('nothing typed, or something that is no number, cannot be saved', async () => {
  await openWaist();
  expect(canSave()).toBe(false);
  await type(['abc']);
  expect(canSave()).toBe(false);
});

it('inches are entered, centimeters are stored', async () => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await openWaist();
  await type(['36', '36.5', '36.25']);
  await save();
  await expect.poll(async () => (await stored()).length).toBe(1);
  const entry = (await stored())[0];
  expectClose(entry?.waistCm ?? 0, 36.25 * 2.54, 1e-9);
  expect(entry?.readings).toHaveLength(3);
});

it('the fields are empty again after saving, and the card says when the next is due', async () => {
  await openWaist();
  await type(['91.5', '92.5', '92.0']);
  await save();
  expect(await screen.findByText(/Weekly is enough: the next is due Oct 12\./)).toBeInTheDocument();
  expect(field(0)).toHaveValue('');
});

it('a reading that cannot be a waist is refused and nothing is stored', async () => {
  await openWaist();
  await type(['920']);
  await save();
  expect(await screen.findByText('That value looks off. Check it.')).toBeInTheDocument();
  expect(await stored()).toEqual([]);
});
