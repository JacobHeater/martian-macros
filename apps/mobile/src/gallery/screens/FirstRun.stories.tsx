import type { Meta } from '@storybook/react-vite';
import { HealthRecheckScreen } from '../../app/HealthRecheckScreen';
import { WelcomeBackScreen } from '../../app/WelcomeBackScreen';
import { minorScenario } from './minorScenario';
import { newInstallScenario } from './newInstallScenario';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import { walkOnboarding } from './walkOnboarding';

/** What a person sees before the app has a plan for them, and when it has to stop and ask. */
const meta = { title: 'Screens/First run and gates', ...screensMeta } satisfies Meta;
export default meta;

export const ThemeChooser = screenStory({
  covers: ['ThemeChooserScreen'],
  shows: 'Choose your theme',
  scenario: newInstallScenario,
  unthemed: true,
});

export const Welcome = screenStory({
  covers: ['OnboardingScreen', 'WelcomeStep'],
  shows: 'Get started',
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

export const Goal = screenStory({
  covers: ['GoalStep'],
  shows: 'Your plan',
  scenario: newInstallScenario,
  walk: (canvas) => walkOnboarding(canvas, 7),
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
