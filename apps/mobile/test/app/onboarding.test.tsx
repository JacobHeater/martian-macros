import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { chooseDay } from '../support/pickers';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';
import { single } from '../support/single';

/** Carried over from the onboarding tests of app_test.dart. */
const today = CalendarDate.of(2026, 10, 10);

async function begin() {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Begin' }));
  return repos;
}

const next = () => screen.getByRole('button', { name: 'Next' });
const press = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }));
const type = (label: string, text: string) => userEvent.type(screen.getByRole('textbox', { name: label }), text);
const heading = (name: string) => screen.getByRole('heading', { name });

/** Chooses a date by accepting the one the picker opens on. */
async function acceptDate() {
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
}

it('onboarding requires sex and birth date, then creates a plan', async () => {
  const repos = await begin();
  expect(heading('Biological sex')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Step 1 of 8' })).toBeInTheDocument();
  expect(next(), 'nothing chosen yet').toBeDisabled();
  await press('Male');
  expect(next()).toBeEnabled();
  await userEvent.click(next());

  expect(heading('Date of birth')).toBeInTheDocument();
  expect(next(), 'no date of birth yet').toBeDisabled();
  await press(/Choose a date/);
  await acceptDate();
  expect(screen.getByRole('button', { name: /January 1, 1996/ })).toBeInTheDocument();
  expect(next()).toBeEnabled();
  await userEvent.click(next());

  expect(next(), 'measurements missing').toBeDisabled();
  await type('Feet', '5');
  await type('Inches', '11');
  await type('lb', '200');
  await userEvent.click(next());

  expect(heading('Your day')).toBeInTheDocument();
  await userEvent.click(next()); // activity

  await userEvent.click(screen.getByRole('switch', { name: 'I currently take creatine' }));
  await press(/When did you start\?/);
  await acceptDate();
  await userEvent.click(next()); // training

  // Male profile: female-only questions are not offered.
  expect(screen.queryByRole('checkbox', { name: 'Pregnant' })).not.toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: 'Chronic kidney disease' })).toBeInTheDocument();
  await userEvent.click(next()); // health

  expect(screen.getByText('Recommended')).toBeInTheDocument();
  await userEvent.click(next()); // the goal

  // What the first month looks like (MM-158), then the app.
  expect(heading('What to expect')).toBeInTheDocument();
  expect(screen.getByText(/These are the plan’s aims, not promises/)).toBeInTheDocument();
  await press('Start');

  // Lands on the main shell with targets already issued.
  expect(await screen.findByRole('navigation', { name: 'Destinations' })).toBeInTheDocument();
  const setup = await repos.setup.loadSetup();
  expect(setup?.profile.sex).toBe('male');
  expectClose(setup?.profile.heightCm, 180.3, 0.1);
  expect(setup?.creatineStartedOn).toBe(today);
  expect(setup?.onboardedOn).toBe(today);
  expectClose(single(await first(repos.weights.watchWeights())).weightKg, 90.7, 0.1);
  await expect.poll(async () => (await first(repos.targets.watchTargetsHistory())).length).toBe(1);
});

it('female onboarding offers female-only health questions', async () => {
  await begin();
  await press('Female');
  await userEvent.click(next());
  await press(/Choose a date/);
  await acceptDate();
  await userEvent.click(next());
  await type('Feet', '5');
  await type('Inches', '5');
  await type('lb', '150');
  await userEvent.click(next());
  await userEvent.click(next()); // activity
  await userEvent.click(next()); // training

  expect(screen.getByRole('checkbox', { name: 'Pregnant' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('checkbox', { name: 'Breastfeeding' }));
  await userEvent.click(next());

  // Lactation locks the plan to maintenance: no deficit modes offered.
  expect(screen.getByRole('button', { name: /^Maintenance/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Fat loss/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Recomp/ })).not.toBeInTheDocument();
});

// Added in the move.
it('someone under eighteen is told why and cannot go on', async () => {
  await begin();
  await press('Male');
  await userEvent.click(next());
  await press(/Choose a date/);
  const dialog = await screen.findByRole('dialog');
  await chooseDay(dialog, CalendarDate.of(2010, 5, 1));
  await userEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
  expect(screen.getByText(/Martian Macros is for adults 18 and over/)).toBeInTheDocument();
  expect(next()).toBeDisabled();
});

it('changing units clears what was typed, and metric asks for centimeters', async () => {
  await begin();
  await press('Male');
  await userEvent.click(next());
  await press(/Choose a date/);
  await acceptDate();
  await userEvent.click(next());
  await type('Feet', '5');
  await press('kg / cm');
  expect(screen.queryByRole('textbox', { name: 'Feet' })).not.toBeInTheDocument();
  await type('Centimeters', '180');
  await type('kg', '25');
  expect(next(), 'too light to be an adult weight').toBeDisabled();
  await userEvent.clear(screen.getByRole('textbox', { name: 'kg' }));
  await type('kg', '82');
  expect(next()).toBeEnabled();
  await press('lb / ft');
  expect(screen.getByRole('textbox', { name: 'Feet' })).toHaveValue('');
  expect(next()).toBeDisabled();
});
