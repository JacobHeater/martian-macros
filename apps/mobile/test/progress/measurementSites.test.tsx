import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import type { BiologicalSex } from '../../src/domain/BiologicalSex';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { MeasurementSettings } from '../../src/domain/measurements/MeasurementSettings';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/** MM-156: measuring more than the waist, if the user wants to. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

async function person({
  sex = 'female',
  goal = 'recomp',
  eatingDisorderHistory = false,
}: { sex?: BiologicalSex; goal?: GoalMode; eatingDisorderHistory?: boolean } = {}): Promise<void> {
  await repos.setup.saveSetup(
    typicalSetup({
      sex,
      goalMode: goal,
      onboardedOn: today.addDays(-40),
      healthCheckConfirmedOn: today,
      screening: new ScreeningAnswers({ eatingDisorderHistory }),
    }).copyWith({ unitSystem: 'metric' }),
  );
}

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.weights.saveWeight(today, 70);
});

const layer = () => within(topLayer());
const settings = () => first(repos.measurementSettings.watchMeasurementSettings());

/** Opens Progress at its "More measurements" section, unfolded. */
async function openMeasurements(): Promise<HTMLElement> {
  renderApp(repos, today);
  await openCoach();
  const section = (await screen.findByRole('heading', { name: 'More measurements' })).closest('.mm-section') as HTMLElement;
  await userEvent.click(within(section).getByRole('button', { name: /^More measurements/ }));
  return section;
}

it('Suggested once: a female profile on recomp who has only waist is offered hips, upper arm and thigh, and declining is remembered', async () => {
  await person();
  const section = await openMeasurements();
  expect(await within(section).findByText(/^Suggested for your goal: hips, upper arm and thigh\./)).toBeInTheDocument();
  await userEvent.click(within(section).getByRole('button', { name: 'No thanks' }));
  await expect.poll(async () => (await settings()).suggestionAnswered).toBe(true);
  expect([...(await settings()).sites]).toEqual([]);
  expect(within(section).queryByText(/^Suggested for your goal/)).not.toBeInTheDocument();
});

it('accepting the suggestion adds the sites, asking once which side limbs are measured on', async () => {
  await person();
  const section = await openMeasurements();
  await userEvent.click(await within(section).findByRole('button', { name: 'Add them' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Right' }));
  await expect.poll(async () => [...(await settings()).sites].sort()).toEqual(['hips', 'thigh', 'upperArm']);
  expect((await settings()).limbSide).toBe('right');
  expect((await settings()).suggestionAnswered).toBe(true);
});

it('Sex-specific suggestion: a male profile is not offered hips, and can still add them', async () => {
  await person({ sex: 'male', goal: 'fatLoss' });
  const section = await openMeasurements();
  await within(section).findByText('Waist only. Other sites are there if you want them.');
  expect(within(section).queryByText(/^Suggested for your goal/)).not.toBeInTheDocument();
  await userEvent.click(within(section).getByRole('button', { name: /^Choose sites/ }));
  await userEvent.click(await layer().findByRole('switch', { name: /^Hips/ }));
  await expect.poll(async () => [...(await settings()).sites]).toEqual(['hips']);
});

it('Eating-disorder history: no additional site is suggested', async () => {
  await person({ eatingDisorderHistory: true });
  const section = await openMeasurements();
  await within(section).findByText('Waist only. Other sites are there if you want them.');
  expect(within(section).queryByText(/^Suggested for your goal/)).not.toBeInTheDocument();
});

it('Adding a site: upper arm, left side, joins the measuring session with its instruction', async () => {
  await person({ sex: 'male', goal: 'fatLoss' });
  const section = await openMeasurements();
  await userEvent.click(await within(section).findByRole('button', { name: /^Choose sites/ }));
  await userEvent.click(await layer().findByRole('switch', { name: /^Upper arm/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Left' }));
  await expect.poll(async () => (await settings()).limbSide).toBe('left');
  expect(await layer().findByText('Limbs are measured on the left side.')).toBeInTheDocument();
  await userEvent.click(layer().getByRole('button', { name: 'Back' }));
  await userEvent.click(await within(section).findByRole('button', { name: 'Measure' }));
  const arm = await layer().findByRole('region', { name: 'Upper arm (left)' });
  expect(within(arm).getByText('Arm hanging relaxed, midway between the shoulder and the elbow. Not flexed.')).toBeInTheDocument();
});

it('A session: with waist, hips and thigh one screen takes all three in order and stores each median', async () => {
  await person();
  await repos.measurementSettings.saveMeasurementSettings(
    new MeasurementSettings({ sites: ['thigh', 'hips'], limbSide: 'left', suggestionAnswered: true }),
  );
  const section = await openMeasurements();
  await userEvent.click(await within(section).findByRole('button', { name: 'Measure' }));
  await layer().findByRole('region', { name: 'Waist' });
  // Each site a section of its own, in order.
  expect(layer().getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(['Waist', 'Hips', 'Thigh (left)']);
  const typeIn = async (name: string, readings: readonly string[]) => {
    const region = layer().getByRole('region', { name });
    for (const [i, reading] of readings.entries()) {
      await userEvent.type(within(region).getAllByRole('textbox')[i] as HTMLElement, reading);
    }
  };
  await typeIn('Waist', ['80', '81', '80.5']);
  await typeIn('Hips', ['99', '98', '98.5']);
  await typeIn('Thigh (left)', ['57']);
  await userEvent.click(layer().getByRole('button', { name: 'Save measurements' }));
  await expect.poll(async () => (await first(repos.measurements.watchMeasurements())).length).toBe(3);
  const stored = await first(repos.measurements.watchMeasurements());
  expect(stored.map((o) => [o.site, o.valueCm])).toEqual([
    ['waist', 80.5],
    ['hips', 98.5],
    ['thigh', 57],
  ]);
  expect(stored[1]?.readings).toEqual([99, 98, 98.5]);
  // The waist is the waist's store too: its card reads the same entry.
  expect((await first(repos.waist.watchWaist())).map((w) => w.waistCm)).toEqual([80.5]);
});

it('a value no hip can be is refused, and nothing of the session is saved', async () => {
  await person();
  await repos.measurementSettings.saveMeasurementSettings(new MeasurementSettings({ sites: ['hips'], suggestionAnswered: true }));
  const section = await openMeasurements();
  await userEvent.click(await within(section).findByRole('button', { name: 'Measure' }));
  const hips = await layer().findByRole('region', { name: 'Hips' });
  const field = within(hips).getAllByRole('textbox')[0] as HTMLElement;
  await userEvent.type(field, '9');
  await userEvent.click(layer().getByRole('button', { name: 'Save measurements' }));
  // Said on the field, which takes focus.
  expect(await within(hips).findByRole('alert')).toHaveTextContent('That hips reading looks off. Check it.');
  expect(field).toHaveAttribute('aria-invalid', 'true');
  await waitFor(() => expect(field).toHaveFocus());
  expect(await first(repos.measurements.watchMeasurements())).toEqual([]);
});

it('two of three readings: once the site is left, its field says why Save is off', async () => {
  await person();
  await repos.measurementSettings.saveMeasurementSettings(new MeasurementSettings({ sites: ['hips'], suggestionAnswered: true }));
  const section = await openMeasurements();
  await userEvent.click(await within(section).findByRole('button', { name: 'Measure' }));
  const waist = await layer().findByRole('region', { name: 'Waist' });
  const [first1, second, third] = within(waist).getAllByRole('textbox') as HTMLElement[];
  await userEvent.type(first1 as HTMLElement, '80');
  await userEvent.click(second as HTMLElement);
  await userEvent.type(second as HTMLElement, '81');
  // Moving on to the third reading says nothing yet.
  await userEvent.click(third as HTMLElement);
  expect(within(waist).queryByRole('alert')).not.toBeInTheDocument();
  expect(layer().getByRole('button', { name: 'Save measurements' })).toBeDisabled();
  // Leaving the site with two says why.
  await userEvent.click(within(layer().getByRole('region', { name: 'Hips' })).getAllByRole('textbox')[0] as HTMLElement);
  expect(await within(waist).findByRole('alert')).toHaveTextContent('Type one reading, or all three.');
  expect(layer().getByRole('button', { name: 'Save measurements' })).toBeDisabled();
  await userEvent.type(third as HTMLElement, '80.5');
  expect(within(waist).queryByRole('alert')).not.toBeInTheDocument();
  expect(layer().getByRole('button', { name: 'Save measurements' })).toBeEnabled();
});

it('the drawing is shown in full the first session, and behind "How to measure" from the second', async () => {
  await person();
  await repos.measurementSettings.saveMeasurementSettings(new MeasurementSettings({ sites: ['hips'], suggestionAnswered: true }));
  await repos.measurements.saveMeasurement('waist', today.addDays(-7), 80);
  const section = await openMeasurements();
  await userEvent.click(await within(section).findByRole('button', { name: 'Measure' }));
  const waist = await layer().findByRole('region', { name: 'Waist' });
  expect(within(waist).getByRole('button', { name: /^How to measure/ })).toBeInTheDocument();
  const hips = layer().getByRole('region', { name: 'Hips' });
  expect(within(hips).queryByRole('button', { name: /^How to measure/ })).not.toBeInTheDocument();
});

it('"Choose sites" ends the sites group, saying how many of six are measured', async () => {
  await person();
  await repos.measurementSettings.saveMeasurementSettings(
    new MeasurementSettings({ sites: ['hips', 'thigh', 'upperArm'], limbSide: 'left', suggestionAnswered: true }),
  );
  const section = await openMeasurements();
  const choose = await within(section).findByRole('button', { name: /^Choose sites/ });
  expect(within(choose).getByText('3 of 6')).toBeInTheDocument();
});

it('the limb side can be changed, saying earlier entries were on the other side', async () => {
  await person();
  await repos.measurementSettings.saveMeasurementSettings(
    new MeasurementSettings({ sites: ['thigh'], limbSide: 'left', suggestionAnswered: true }),
  );
  await repos.measurements.saveMeasurement('thigh', today.addDays(-7), 57);
  const section = await openMeasurements();
  await userEvent.click(await within(section).findByRole('button', { name: /^Choose sites/ }));
  await userEvent.click(await layer().findByRole('button', { name: /^Limb side/ }));
  await userEvent.click(await screen.findByRole('option', { name: /^Right/ }));
  await expect.poll(async () => (await settings()).limbSide).toBe('right');
  expect(await screen.findByText('Limbs are measured on the right side from now on. Earlier entries were on the left side.')).toBeInTheDocument();
  expect(await layer().findByText('Limbs are measured on the right side.')).toBeInTheDocument();
});

it('Limits of a tape: upper arm up 1.0 cm with no clear change in the waist is said as two facts', async () => {
  await person({ sex: 'male', goal: 'fatLoss' });
  await repos.measurementSettings.saveMeasurementSettings(
    new MeasurementSettings({ sites: ['upperArm'], limbSide: 'left', suggestionAnswered: true }),
  );
  for (let i = 0; i <= 12; i++) {
    const day = today.addDays(-7 * (12 - i));
    await repos.measurements.saveMeasurement('waist', day, 90);
    await repos.measurements.saveMeasurement('upperArm', day, 33 + i / 12);
  }
  const section = await openMeasurements();
  expect(await within(section).findByText('Upper arm (left) up 1.0 cm in 12 weeks while waist held.')).toBeInTheDocument();
  expect(within(section).queryByText(/muscle/i)).not.toBeInTheDocument();
});
