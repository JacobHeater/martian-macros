import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { EvidenceQuestionScreen } from '../../about/EvidenceQuestionScreen';
import { HowThisWorksScreen } from '../../about/HowThisWorksScreen';
import { CalendarDate } from '../../domain/CalendarDate';
import { EvidenceRegister } from '../../domain/evidence/EvidenceRegister';
import { FoodDatabaseScreen } from '../../foodPacks/FoodDatabaseScreen';
import { EditHeightSheet } from '../../settings/EditHeightSheet';
import { HealthCheckScreen } from '../../settings/HealthCheckScreen';
import { SettingsScreen } from '../../settings/SettingsScreen';
import { TermsScreen } from '../../terms/TermsScreen';
import { measuredBodyFatScenario } from './measuredBodyFatScenario';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';

/**
 * Everything the person set up and can change, and what the app says about
 * itself. Before MM-259 (main at 9fb8c79, 2026-10-13) twelve groups mixing
 * chips, segments, sliders and rows; after, sections of rows in the order
 * of use, every row with its icon, erase last.
 */
const meta = { title: 'Screens/Settings', ...screensMeta } satisfies Meta;
export default meta;

export const Settings = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Today’s setup',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
});

/** MM-240: both sliders, each in a row at the row's inset. */
export const MeasuredBodyFat = screenStory({
  covers: ['SettingsScreen'],
  shows: /About 22%/,
  scenario: measuredBodyFatScenario,
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
});

export const EditHeight = screenStory({
  covers: ['EditHeightSheet'],
  shows: 'Height',
  open: ({ navigator, overlays }) => {
    void navigator.push(() => <SettingsScreen />);
    void overlays.sheet<void>('Height', (close) => (
      <EditHeightSheet initialCm={180} imperial onSave={() => close()} />
    ));
  },
});

/** MM-268: a choice in Settings is the options dialog, with the value in force marked Chosen. */
export const ChangeDailyActivity = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Chosen',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Change daily activity' }));
  },
});

/** MM-263: the design system's own calendar inside a dialog, with the day said back in words. */
export const DateOfBirth = screenStory({
  covers: ['SettingsScreen'],
  shows: 'January 1, 1996',
  open: ({ navigator, overlays }) => {
    void navigator.push(() => <SettingsScreen />);
    void overlays.date({
      helpText: 'Date of birth',
      initial: CalendarDate.of(1996, 1, 1),
      first: CalendarDate.of(1926, 1, 1),
      last: CalendarDate.of(2008, 10, 12),
      today: CalendarDate.of(2008, 10, 12),
    });
  },
});

export const HealthCheck = screenStory({
  covers: ['HealthCheckScreen'],
  shows: 'Health check',
  open: ({ navigator }) => void navigator.push(() => <HealthCheckScreen />),
});

export const FoodDatabase = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: 'Food database',
  open: ({ navigator }) => void navigator.push(() => <FoodDatabaseScreen />),
});

/** MM-242: the terms, to read again, with the day they were agreed to. */
export const TermsOfUse = screenStory({
  covers: ['TermsScreen'],
  shows: 'Before you start',
  open: ({ navigator }) => void navigator.push(() => <TermsScreen />),
});

export const HowThisWorks = screenStory({
  covers: ['HowThisWorksScreen'],
  shows: 'How this works',
  open: ({ navigator }) => void navigator.push(() => <HowThisWorksScreen />),
});

export const EvidenceQuestion = screenStory({
  covers: ['EvidenceQuestionScreen'],
  shows: /./,
  open: async ({ services, navigator }) => {
    const [question] = EvidenceRegister.parse(await services.evidence()).questions;
    if (question !== undefined) void navigator.push(() => <EvidenceQuestionScreen question={question} />);
  },
});
