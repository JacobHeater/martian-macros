import type { Meta } from '@storybook/react-vite';
import { waitingRead } from './waitingRead';
import { minorScenario } from './minorScenario';
import { failingWrite } from './failingWrite';
import { failingRead } from './failingRead';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { Pause } from '../../domain/Pause';
import { userEvent, within } from 'storybook/test';
import { HealthRecheckScreen } from '../../app/HealthRecheckScreen';
import { WelcomeBackScreen } from '../../app/WelcomeBackScreen';
import { newInstallScenario } from './newInstallScenario';
import { onIos } from './onIos';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import { storyToday } from './storyToday';
import { walkOnboarding } from './walkOnboarding';

/** What a person sees before the app has a plan for them, and when it has to stop and ask. */
const meta = { title: 'Screens/First run and gates', ...screensMeta } satisfies Meta;
export default meta;

/** Presses a button of the screen, once it is there. */
const press = (name: string) => async (canvas: HTMLElement) =>
  userEvent.click(await within(canvas).findByRole('button', { name }));

/** MM-242: the first thing a new installation shows. */
export const TermsOfUse = screenStory({
  covers: ['TermsGuardScreen'],
  shows: 'Before you start',
  scenario: newInstallScenario,
  terms: 'unanswered',
});

export const TermsNotNow = screenStory({
  covers: ['TermsGuardScreen'],
  shows: 'That is fine',
  scenario: newInstallScenario,
  terms: 'unanswered',
  walk: press('Not now'),
});

/** MM-403: on an iPhone the page cannot offer to close the app; it says to go back to the Home Screen, and that the app asks again. */
export const TermsNotNowOnIos = screenStory({
  covers: ['TermsGuardScreen'],
  shows: /go back to the Home Screen; the app will ask again/,
  scenario: newInstallScenario,
  device: onIos(),
  terms: 'unanswered',
  walk: press('Not now'),
});

/** Someone with ten weeks of records meets terms newer than the ones they agreed to. */
export const TermsChanged = screenStory({
  covers: ['TermsGuardScreen'],
  shows: 'The terms have changed',
  terms: 'earlier',
});

/** They can still erase their records without agreeing. */
export const TermsChangedNotNow = screenStory({
  covers: ['TermsGuardScreen'],
  shows: 'Erase all data',
  terms: 'earlier',
  walk: press('Not now'),
});

export const ThemeChooser = screenStory({
  covers: ['ThemeChooserScreen'],
  shows: 'Choose your theme',
  scenario: newInstallScenario,
  unthemed: true,
});

export const Welcome = screenStory({
  covers: ['OnboardingScreen', 'WelcomeStep'],
  shows: 'Begin',
  scenario: newInstallScenario,
});

export const BiologicalSex = screenStory({
  covers: ['SexStep'],
  shows: 'Biological sex',
  scenario: newInstallScenario,
  walk: (canvas) => walkOnboarding(canvas, 1),
});

export const DateOfBirth = screenStory({
  covers: ['BirthDateStep'],
  shows: 'Date of birth',
  scenario: newInstallScenario,
  walk: (canvas) => walkOnboarding(canvas, 2),
});

export const Measurements = screenStory({
  covers: ['MeasurementsStep'],
  shows: 'Your measurements',
  scenario: newInstallScenario,
  walk: (canvas) => walkOnboarding(canvas, 3),
});

export const Activity = screenStory({
  covers: ['ActivityStep'],
  shows: 'Your day',
  scenario: newInstallScenario,
  walk: (canvas) => walkOnboarding(canvas, 4),
});

export const Training = screenStory({
  covers: ['TrainingStep'],
  shows: 'Resistance training experience',
  scenario: newInstallScenario,
  walk: (canvas) => walkOnboarding(canvas, 5),
});

export const HealthCheck = screenStory({
  covers: ['HealthStep'],
  shows: 'Health check',
  scenario: newInstallScenario,
  walk: (canvas) => walkOnboarding(canvas, 6),
});

/** MM-251: a diagnosed sleep disorder ticked: the caution with its clinician pointer, and nothing in the numbers. */
export const HealthCheckSleepDisorder = screenStory({
  covers: ['HealthStep'],
  shows: /^Sleep disorders change how a deficit works for you/,
  scenario: newInstallScenario,
  walk: async (canvas) => {
    await walkOnboarding(canvas, 6);
    await userEvent.click(await within(canvas).findByRole('checkbox', { name: /^A diagnosed sleep disorder/ }));
  },
});

/** MM-128: under a chosen fat-loss goal, the three paces with what each would cost from the starting estimate. */
export const GoalPaces = screenStory({
  covers: ['GoalStep'],
  shows: 'How fast',
  scenario: newInstallScenario,
  walk: async (canvas) => {
    await walkOnboarding(canvas, 7);
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Fat loss/ }));
  },
});

export const Goal = screenStory({
  covers: ['GoalStep'],
  shows: 'Your plan',
  scenario: newInstallScenario,
  walk: (canvas) => walkOnboarding(canvas, 7),
});

/** MM-158: the last step, what the first month will look like, every figure the person's own, and the weigh-in reminder offered once. */
export const WhatToExpect = screenStory({
  covers: ['WhatToExpectStep'],
  shows: 'What to expect',
  scenario: newInstallScenario,
  walk: (canvas) => walkOnboarding(canvas, 8),
});

export const AdultsOnly = screenStory({
  covers: ['AdultsOnlyScreen'],
  shows: 'Martian Macros is for adults',
  scenario: minorScenario,
});

export const WelcomeBack = screenStory({
  covers: ['WelcomeBackScreen'],
  shows: 'Welcome back',
  open: ({ navigator }) => void navigator.push(() => <WelcomeBackScreen />),
});

export const ReadyToResume = screenStory({
  covers: ['WelcomeBackScreen'],
  shows: 'Ready to resume?',
  open: ({ navigator }) => void navigator.push(() => <WelcomeBackScreen resuming />),
});

export const HealthRecheck = screenStory({
  covers: ['HealthRecheckScreen'],
  shows: 'Health check',
  open: ({ navigator }) => void navigator.push(() => <HealthRecheckScreen />),
});

// ---- MM-321: the app shell, in the states no story drew ----

/** Presses the button named `name` anywhere on the page, once it is there. */
const pressAnywhere = (name: string | RegExp) => async (canvas: HTMLElement) => {
  const button = await within(canvas.ownerDocument.body).findByRole('button', { name }, { timeout: 8000 });
  await userEvent.click(button);
};

/** MM-321: the gear on the home screens opens Settings. */
export const HomeOpensSettings = screenStory({
  covers: ['DashboardScreen', 'SettingsScreen'],
  shows: 'Today’s setup',
  walk: pressAnywhere('Settings'),
});

/** MM-321: under eighteen: correcting the date of birth opens Settings at "You" (MM-398). */
export const AdultsOnlyOpensSettings = screenStory({
  covers: ['AdultsOnlyScreen', 'SettingsScreen'],
  shows: 'Date of birth',
  scenario: minorScenario,
  walk: pressAnywhere('Correct date of birth'),
});

/** MM-321: the demo build, its notice around every screen. */
export const DemoBuild = screenStory({ covers: ['DashboardScreen'], shows: 'More about this week', demo: true });

/** MM-321: the look still being read: the app waits on its spinner. */
export const ThemeLoading = screenStory({
  covers: ['DashboardScreen'],
  stores: waitingRead('preferences', 'watchThemePreference'),
  walk: async (canvas) => {
    await within(canvas).findByRole('progressbar', { name: 'Loading' });
  },
});

/** MM-321: the look could not be read. */
export const ThemeFailed = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Could not load your theme preference',
  stores: failingRead('preferences', 'watchThemePreference'),
});

/** MM-321: the agreement to the terms still being read. */
export const TermsLoading = screenStory({
  covers: ['TermsGuardScreen'],
  stores: waitingRead('preferences', 'watchTermsAcceptance'),
  walk: async (canvas) => {
    await within(canvas).findByRole('progressbar', { name: 'Loading' });
  },
});

/** MM-321: the agreement to the terms could not be read. */
export const TermsFailed = screenStory({
  covers: ['TermsGuardScreen'],
  shows: /could not/i,
  stores: failingRead('preferences', 'watchTermsAcceptance'),
});

/** MM-321: back after twelve days without a log or a weigh-in: welcome back. */
export const WelcomeBackAfterAGap = screenStory({
  covers: ['WelcomeBackScreen'],
  shows: 'Welcome back',
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
    for (let d = 60; d >= 12; d -= 2) await repos.weights.saveWeight(today.addDays(-d), 86 - (60 - d) * 0.03);
  },
});

/** MM-321: a pause that ended yesterday, nothing weighed since: resuming. */
export const ResumingAfterAPause = screenStory({
  covers: ['WelcomeBackScreen'],
  shows: 'Ready to resume?',
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
    for (let d = 60; d >= 9; d -= 2) await repos.weights.saveWeight(today.addDays(-d), 86 - (60 - d) * 0.03);
    await repos.pauses.savePause(new Pause({ from: today.addDays(-8), to: today.addDays(-1), reason: 'travel' }));
  },
});

/** MM-321: ninety days since the health check: it is asked again before anything else. */
export const HealthCheckDue = screenStory({
  covers: ['HealthRecheckScreen'],
  shows: 'Health check',
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-120), healthCheckConfirmedOn: today.addDays(-100) }));
    await repos.weights.saveWeight(today, 84);
  },
});

/** MM-321: the first look chosen, and the save failing. */
export const ThemeChoiceFails = screenStory({
  covers: ['ThemeChooserScreen'],
  shows: 'Could not save your theme. Please try again.',
  scenario: newInstallScenario,
  unthemed: true,
  stores: failingWrite('preferences', 'saveThemePreference'),
  walk: pressAnywhere('Continue'),
});

/** MM-321: a birth date picked from the year list that makes the person twelve: the app is for adults. */
export const DateOfBirthMinor = screenStory({
  covers: ['BirthDateStep'],
  shows: /^Martian Macros is for adults 18 and over/,
  scenario: newInstallScenario,
  walk: async (canvas) => {
    await walkOnboarding(canvas, 2);
    const app = within(canvas.ownerDocument.body);
    await userEvent.click(await app.findByRole('button', { name: /Choose a date/ }));
    const dialog = within(await app.findByRole('dialog'));
    await userEvent.click(await dialog.findByRole('button', { name: /^[A-Z][a-z]+ \d{4}/, expanded: false }));
    const year = storyToday.year - 12;
    await userEvent.click(await dialog.findByRole('option', { name: String(year) }));
    // The year moves the calendar; a day of it is then chosen.
    await userEvent.click(await dialog.findByRole('gridcell', { name: new RegExp(`^[A-Z][a-z]+ 15, ${year}$`) }));
    await userEvent.click(dialog.getByRole('button', { name: 'OK' }));
  },
});

/** MM-321: the training step with a body-fat measurement and creatine both switched on. */
export const TrainingWithBodyFatAndCreatine = screenStory({
  covers: ['TrainingStep'],
  shows: 'When did you start?',
  scenario: newInstallScenario,
  walk: async (canvas) => {
    await walkOnboarding(canvas, 5);
    const app = within(canvas);
    await userEvent.click(await app.findByRole('switch', { name: /I don’t know/ }));
    await userEvent.click(await app.findByRole('switch', { name: /I currently take creatine/ }));
  },
});

/** MM-321: "I agree" pressed and the agreement not saved: it says so, and asks again. */
export const TermsAgreeFails = screenStory({
  covers: ['TermsGuardScreen'],
  shows: 'Could not save your answer, so nothing was recorded. Please try again.',
  terms: 'unanswered',
  stores: failingWrite('preferences', 'saveTermsAcceptance'),
  walk: pressAnywhere('I agree'),
});

/**
 * MM-134, MM-417: the goal step for someone not lifting yet, Lean gain chosen: what training means here, and the one
 * acknowledgement a surplus without training asks for. A lighter person, so Lean gain is among the goals offered.
 */
export const GoalLeanGainNotTraining = screenStory({
  covers: ['GoalStep'],
  shows: /^Training here means/,
  scenario: newInstallScenario,
  walk: async (canvas) => {
    const app = within(canvas);
    const press = async (name: string | RegExp) => userEvent.click(await app.findByRole('button', { name }, { timeout: 5000 }));
    await press('Begin');
    await press('Male');
    await press('Next');
    await press(/Choose a date/);
    await userEvent.click(await within(await app.findByRole('dialog')).findByRole('button', { name: 'OK' }));
    await press('Next');
    await userEvent.type(await app.findByRole('textbox', { name: 'Feet' }), '5');
    await userEvent.type(await app.findByRole('textbox', { name: 'Inches' }), '11');
    await userEvent.type(await app.findByRole('textbox', { name: 'lb' }), '150');
    await press('Next');
    await press('Next');
    await press('Not lifting yet');
    await press('Next');
    await press('Next');
    await press(/^Lean gain/);
  },
});
