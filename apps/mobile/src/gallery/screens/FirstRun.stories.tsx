import type { Meta } from '@storybook/react-vite';
import { waitingRead } from './waitingRead';
import { minorScenario } from './minorScenario';
import { failingWrite } from './failingWrite';
import { failingRead } from './failingRead';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { CalendarDate } from '../../domain/CalendarDate';
import { Pause } from '../../domain/Pause';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HealthRecheckScreen } from '../../app/HealthRecheckScreen';
import { WelcomeBackScreen } from '../../app/WelcomeBackScreen';
import { newInstallScenario } from './newInstallScenario';
import { appleHealthProfile } from './appleHealthProfile';
import { onIos } from './onIos';
import { healthPlatform } from './healthPlatform';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import { storyToday } from './storyToday';
import { walkOnboarding } from './walkOnboarding';

/** What a person sees before the app has a plan for them, and when it has to stop and ask. */
const meta = { title: 'Screens/First run and gates', ...screensMeta } satisfies Meta;
export default meta;

/** Presses a button of the screen, once it is there. */
const press = (name: string | RegExp) => async (canvas: HTMLElement) =>
  userEvent.click(await within(canvas).findByRole('button', { name }));

/**
 * MM-546: the app's spinner for one startup read, once the reads before it are in. The three
 * spinners look alike, and the first one shows while every read is out, so a walk that waited
 * for any spinner could end before the one it is about was ever drawn.
 */
const waitsOn = (read: 'setup' | 'theme' | 'terms') => async (canvas: HTMLElement) => {
  const waiting = await within(canvas).findByTestId(`waiting-${read}`);
  await within(waiting).findByRole('progressbar', { name: 'Loading' });
};

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

/** MM-69: on an iPhone, the first step offers to fill in from Apple Health. */
export const BiologicalSexOnIos = screenStory({
  covers: ['SexStep'],
  shows: 'Fill in from Apple Health',
  scenario: newInstallScenario,
  device: appleHealthProfile(),
  walk: (canvas) => walkOnboarding(canvas, 1),
});

/** What Apple Health holds, filled in from it; the sex selected, still to be confirmed with Next. */
const fromAppleHealth = { sex: 'female', birthDate: CalendarDate.of(1990, 4, 12), heightCm: 168 } as const;

export const BiologicalSexFilledFromHealth = screenStory({
  covers: ['SexStep'],
  shows: /Filled in from Apple Health/,
  scenario: newInstallScenario,
  device: appleHealthProfile({ profile: fromAppleHealth }),
  walk: async (canvas) => {
    await walkOnboarding(canvas, 1);
    await press(/^Fill in from Apple Health/)(canvas);
    // The outcome is said and focused, since the row pressed went away (the panel review of MM-69).
    const said = await within(canvas).findByText(/Filled in from Apple Health/);
    await waitFor(() => expect(canvas.ownerDocument.activeElement).toBe(said.closest('[aria-live="polite"]')));
  },
});

/** Apple Health had none of the answers, or reading was refused, which it does not tell: where to allow it. */
export const BiologicalSexNothingInHealth = screenStory({
  covers: ['SexStep'],
  shows: /Apple Health had nothing to fill in/,
  scenario: newInstallScenario,
  device: appleHealthProfile(),
  walk: async (canvas) => {
    await walkOnboarding(canvas, 1);
    await press(/^Fill in from Apple Health/)(canvas);
  },
});

export const BiologicalSexHealthUnreadable = screenStory({
  covers: ['SexStep'],
  shows: /Apple Health could not be read just now/,
  scenario: newInstallScenario,
  device: appleHealthProfile({ unreadable: true }),
  walk: async (canvas) => {
    await walkOnboarding(canvas, 1);
    await press(/^Fill in from Apple Health/)(canvas);
  },
});

/** The date of birth Apple Health held, filled in on the next step. */
export const DateOfBirthFromHealth = screenStory({
  covers: ['BirthDateStep'],
  shows: /April 12, 1990/,
  scenario: newInstallScenario,
  device: appleHealthProfile({ profile: fromAppleHealth }),
  walk: async (canvas) => {
    await walkOnboarding(canvas, 1);
    await press(/^Fill in from Apple Health/)(canvas);
    await within(canvas).findByText(/Filled in from Apple Health/);
    await press('Next')(canvas);
  },
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

/** MM-68, MM-73: on a phone with Health Connect, reading weight is offered under the weight, never required. */
export const MeasurementsHealthConnectOffered = screenStory({
  covers: ['MeasurementsStep'],
  shows: 'Read weight from Health Connect',
  scenario: newInstallScenario,
  device: healthPlatform({ weighInToday: true }),
  walk: (canvas) => walkOnboarding(canvas, 3),
});

/** MM-73: weight allowed, with this morning's weigh-in on the platform: it is offered as the current weight. */
export const MeasurementsWeighInOffered = screenStory({
  covers: ['MeasurementsStep'],
  shows: /^Use 181\.7 lb$/,
  scenario: newInstallScenario,
  device: healthPlatform({ weighInToday: true }),
  walk: async (canvas) => {
    await walkOnboarding(canvas, 3);
    await userEvent.click(await within(canvas).findByRole('button', { name: /Read weight from Health Connect/ }));
    await within(canvas).findByRole('button', { name: /^Use 181\.7 lb/ });
  },
});

/** MM-73: today's weigh-in used: it is in the field, and the caption says where it came from. */
export const MeasurementsWeighInUsed = screenStory({
  covers: ['MeasurementsStep'],
  shows: /Today’s weigh-in from Bathroom scale, in Health Connect/,
  scenario: newInstallScenario,
  device: healthPlatform({ weighInToday: true }),
  walk: async (canvas) => {
    await walkOnboarding(canvas, 3);
    await userEvent.click(await within(canvas).findByRole('button', { name: /Read weight from Health Connect/ }));
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Use 181\.7 lb/ }));
  },
});

/** MM-73: weight just allowed, and Health Connect still being read: the row says so, and the weight field has focus. */
export const MeasurementsReadingHealth = screenStory({
  covers: ['MeasurementsStep'],
  shows: 'Reading Health Connect…',
  scenario: newInstallScenario,
  device: healthPlatform({ weighInToday: true, readsHang: true }),
  walk: async (canvas) => {
    await walkOnboarding(canvas, 3);
    await userEvent.click(await within(canvas).findByRole('button', { name: /Read weight from Health Connect/ }));
    await within(canvas).findByText('Reading Health Connect…');
  },
});

/** MM-73: weight allowed and nothing weighed today: the person types it, and the history still fills the trend. */
export const MeasurementsNoWeighInToday = screenStory({
  covers: ['MeasurementsStep'],
  shows: 'No weigh-in in Health Connect today',
  scenario: newInstallScenario,
  device: healthPlatform(),
  walk: async (canvas) => {
    await walkOnboarding(canvas, 3);
    await userEvent.click(await within(canvas).findByRole('button', { name: /Read weight from Health Connect/ }));
    await within(canvas).findByText('No weigh-in in Health Connect today');
  },
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

/** MM-113, MM-510: the weight-loss medication answer, its own and not blocking, ticked. */
export const HealthCheckWeightLossMedication = screenStory({
  covers: ['HealthStep'],
  shows: 'I take a prescription weight-loss medication',
  scenario: newInstallScenario,
  walk: async (canvas) => {
    await walkOnboarding(canvas, 6);
    await userEvent.click(await within(canvas).findByRole('checkbox', { name: 'I take a prescription weight-loss medication' }));
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

/** MM-321, MM-704: the menu button on the home screens opens the drawer, and its Settings row opens Settings. */
export const HomeOpensSettings = screenStory({
  covers: ['DashboardScreen', 'SettingsScreen'],
  shows: 'Today’s setup',
  walk: async (canvas) => {
    await pressAnywhere('Menu')(canvas);
    const drawer = await within(canvas.ownerDocument.body).findByRole('dialog', { name: 'Menu' });
    await userEvent.click(within(drawer).getByRole('button', { name: 'Settings' }));
  },
});

/** MM-321: under eighteen: correcting the date of birth opens Profile at "You" (MM-398, MM-705). */
export const AdultsOnlyOpensSettings = screenStory({
  covers: ['AdultsOnlyScreen', 'ProfileScreen'],
  shows: 'Date of birth',
  scenario: minorScenario,
  walk: pressAnywhere('Correct date of birth'),
});

/** MM-321: the demo build, its notice around every screen. */
export const DemoBuild = screenStory({ covers: ['DashboardScreen'], shows: 'History', demo: true });

/** MM-546: the person's data still being opened: the app waits on its spinner. */
export const SetupLoading = screenStory({
  covers: ['DashboardScreen'],
  stores: waitingRead('setup', 'watchSetup'),
  walk: waitsOn('setup'),
});

/** MM-321: the look still being read: the app waits on its spinner. */
export const ThemeLoading = screenStory({
  covers: ['DashboardScreen'],
  stores: waitingRead('preferences', 'watchThemePreference'),
  walk: waitsOn('theme'),
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
  walk: waitsOn('terms'),
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
