import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Profile } from '../../src/domain/Profile';
import { TermsAcceptance } from '../../src/domain/TermsAcceptance';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { AppServices } from '../../src/state/AppServices';
import { termsOfUse } from '../../src/terms/termsOfUse';
import { failing } from '../support/failing';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { overriding } from '../support/overriding';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/**
 * MM-242: the terms of use are the first guard, on every installation.
 * Agreeing is one press and is kept on the device; not agreeing records
 * nothing and takes nothing away.
 */
const today = CalendarDate.of(2026, 10, 12);
let repos: InMemoryRepositories;
beforeEach(() => {
  repos = new InMemoryRepositories();
});

const accepted = () => first(repos.preferences.watchTermsAcceptance());
const press = (name: string) => userEvent.click(screen.getByRole('button', { name }));
const open = (change?: (services: AppServices) => AppServices) =>
  renderApp(repos, today, { terms: 'unanswered', ...(change === undefined ? {} : { change }) });

async function withRecords(): Promise<void> {
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
}

describe('a new installation', () => {
  it('shows the terms before the theme chooser and before onboarding, with nothing chosen for the person', async () => {
    open();
    expect(await screen.findByRole('heading', { level: 1, name: 'Terms of use' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Before you start' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Choose your theme' })).not.toBeInTheDocument();
    // One plain press: no box to tick, ticked or not, and neither action switched off.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'I agree' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeEnabled();
    expect(await accepted()).toBeUndefined();
  });

  it('shows every section in full under its own heading, with nothing to open', async () => {
    open();
    await screen.findByRole('heading', { name: 'Before you start' });
    for (const section of termsOfUse.sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument();
      // The short account repeats one or two sentences of the full text on purpose.
      for (const paragraph of section.paragraphs) expect(screen.getAllByText(paragraph).at(-1)).toBeVisible();
    }
  });

  it('agreeing stores the version and the day, and the theme chooser opens', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'I agree' }));
    expect(await screen.findByRole('heading', { name: 'Choose your theme' })).toBeInTheDocument();
    expect(await accepted()).toEqual(new TermsAcceptance({ version: termsOfUse.version, acceptedOn: today }));
  });

  it('not now records nothing, says so without judgement, and leads back to the terms', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(await screen.findByRole('heading', { name: 'That is fine' })).toBeInTheDocument();
    expect(screen.getByText(/Nothing about you has been entered or saved\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close the app' })).toBeInTheDocument();
    // Nothing to erase on a phone that holds nothing.
    expect(screen.queryByRole('button', { name: 'Erase all data' })).not.toBeInTheDocument();
    expect(await accepted()).toBeUndefined();
    await press('Read the terms again');
    expect(await screen.findByRole('button', { name: 'I agree' })).toBeInTheDocument();
  });

  it('not now on an iPhone offers no way to close the app, and says the app can be left from the Home Screen (MM-403)', async () => {
    open((services) => ({ ...services, platform: 'ios' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(await screen.findByRole('heading', { name: 'That is fine' })).toBeInTheDocument();
    expect(screen.getByText(/or go back to the Home Screen; the app will ask again when you open it\./)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close the app' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read the terms again' })).toBeInTheDocument();
    expect(await accepted()).toBeUndefined();
  });

  it('on an iPhone the terms name Apple Health, never Health Connect (MM-403)', async () => {
    open((services) => ({ ...services, platform: 'ios' }));
    await screen.findByRole('heading', { name: 'Before you start' });
    expect(screen.getAllByText(/Apple Health/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Health Connect|ML Kit/)).not.toBeInTheDocument();
  });
});

describe('once agreed', () => {
  it('the terms are not shown again', async () => {
    renderApp(repos, today);
    expect(await screen.findByRole('heading', { name: 'Choose your theme' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Terms of use' })).not.toBeInTheDocument();
  });

  it('they can be read again from Settings, with the version and the day, and nothing there changes the agreement', async () => {
    await withRecords();
    renderApp(repos, today);
    const settings = await openSettings();
    expect(settings.getByText(`Version ${termsOfUse.version}, agreed October 12, 2026`)).toBeInTheDocument();
    await userEvent.click(settings.getByRole('button', { name: /^Terms of use/ }));
    const terms = within(topLayer());
    expect(await terms.findByRole('heading', { level: 1, name: 'Terms of use' })).toBeInTheDocument();
    expect(terms.getByText(/You agreed on October 12, 2026\./)).toBeInTheDocument();
    expect(terms.getByRole('heading', { name: '3. Not medical advice' })).toBeInTheDocument();
    expect(terms.queryByRole('button', { name: 'I agree' })).not.toBeInTheDocument();
    expect(terms.queryByRole('button', { name: 'Not now' })).not.toBeInTheDocument();
  });

  // MM-96: "not medical advice" is where a person would look, not only inside the terms.
  it('Settings says the app is not medical advice in a line of its own', async () => {
    await withRecords();
    renderApp(repos, today);
    const settings = await openSettings();
    expect(settings.getByText('Not medical advice')).toBeInTheDocument();
    expect(settings.getByText(/not a medical device\. It does not diagnose or treat anything\./)).toBeInTheDocument();
  });

  it('someone under eighteen is still stopped', async () => {
    await withRecords();
    const setup = await repos.setup.loadSetup();
    const profile = new Profile({ sex: 'male', birthDate: CalendarDate.of(today.year - 16, 1, 1), heightCm: 175 });
    await repos.setup.saveSetup(setup!.copyWith({ profile }));
    renderApp(repos, today);
    expect(await screen.findByRole('heading', { name: 'Martian Macros is for adults' })).toBeInTheDocument();
  });
});

describe('an installation with records and no agreement', () => {
  beforeEach(withRecords);

  it('sees the terms before anything else, with its records untouched, and goes on to where it was going', async () => {
    open();
    expect(await screen.findByRole('heading', { level: 1, name: 'Terms of use' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
    expect((await repos.setup.loadSetup())?.profile.sex).toBe('male');
    await press('I agree');
    expect(await screen.findByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect((await first(repos.weights.watchWeights())).length).toBe(1);
  });

  it('can erase its records without agreeing, after being asked to confirm', async () => {
    open();
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(screen.getByText(/Your records are still on this phone/)).toBeInTheDocument();
    await press('Erase all data');
    const question = await screen.findByRole('dialog', { name: 'Erase everything?' });
    await userEvent.click(within(question).getByRole('button', { name: 'Erase' }));
    await expect.poll(() => repos.setup.loadSetup()).toBeUndefined();
    expect(await accepted()).toBeUndefined();
    expect(await screen.findByText(/Nothing about you has been entered or saved\./)).toBeInTheDocument();
  });
});

describe('terms that changed', () => {
  it('are shown again, saying they changed and what was agreed to before, and the app waits for an answer', async () => {
    await withRecords();
    await repos.preferences.saveTermsAcceptance(
      new TermsAcceptance({ version: termsOfUse.version - 1, acceptedOn: today.addDays(-30) }),
    );
    open();
    expect(await screen.findByRole('heading', { level: 1, name: 'The terms have changed' })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`You agreed to version ${termsOfUse.version - 1} on September 12, 2026\\.`))).toBeInTheDocument();
    expect(screen.getByText(/your answer here does not remove them/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
    await press('I agree');
    expect(await screen.findByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect((await accepted())?.version).toBe(termsOfUse.version);
  });
});

describe('erasing all data', () => {
  it('removes the agreement, and the terms come before the theme chooser again', async () => {
    await withRecords();
    renderApp(repos, today);
    const settings = await openSettings();
    await userEvent.click(settings.getByRole('button', { name: 'Erase all data and start over' }));
    const question = await screen.findByRole('dialog', { name: 'Erase everything?' });
    await userEvent.click(within(question).getByRole('button', { name: 'Erase' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Terms of use' })).toBeInTheDocument();
    expect(await accepted()).toBeUndefined();
  });
});

describe('when storage goes wrong', () => {
  it('an agreement that cannot be read is not an agreement: the app is not entered, and offers to try again', async () => {
    await withRecords();
    open((services) => ({
      ...services,
      preferences: overriding(services.preferences, { watchTermsAcceptance: () => failing() }),
    }));
    expect(await screen.findByText('Could not check whether you have agreed to the terms of use')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('an answer that cannot be saved is said aloud, records nothing, and can be given again', async () => {
    let fail = true;
    open((services) => ({
      ...services,
      preferences: overriding(services.preferences, {
        saveTermsAcceptance: (acceptance) =>
          fail ? Promise.reject(new Error('disk full')) : repos.preferences.saveTermsAcceptance(acceptance),
      }),
    }));
    await userEvent.click(await screen.findByRole('button', { name: 'I agree' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('nothing was recorded');
    expect(await accepted()).toBeUndefined();
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of use' })).toBeInTheDocument();
    fail = false;
    await press('I agree');
    expect(await screen.findByRole('heading', { name: 'Choose your theme' })).toBeInTheDocument();
  });
});
