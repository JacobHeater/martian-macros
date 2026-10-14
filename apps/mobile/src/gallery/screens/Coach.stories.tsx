import type { Meta } from '@storybook/react-vite';
import { MonthlyReportScreen } from '../../coach/MonthlyReportScreen';
import { RecoveryCheckInScreen } from '../../coach/RecoveryCheckInScreen';
import { showTargetChangeSheet } from '../../coach/showTargetChangeSheet';
import { TargetsHistoryScreen } from '../../coach/TargetsHistoryScreen';
import { PauseScreen } from '../../pause/PauseScreen';
import { checkInDueScenario } from './checkInDueScenario';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import { valueOf } from './valueOf';

/**
 * What the coach believes, why, and what it will do next. Before MM-256
 * (main at 9fb8c79, 2026-10-13) eleven cards of equal weight; after, the
 * safeguards, the hero with the confidence word, one thing to do, and
 * sections with icons, folded to a line when quiet. Since MM-299 the goal
 * comes first under the hero and its warnings, then the one thing to do.
 */
const meta = { title: 'Screens/Coach', ...screensMeta } satisfies Meta;
export default meta;

export const Coach = screenStory({
  covers: ['CoachScreen'],
  shows: 'Your metabolism',
  open: ({ state }) => state.homeTab.put('coach'),
});

/** The one thing to do under the goal: this week's recovery check-in is due (MM-299). */
export const CheckInDue = screenStory({
  covers: ['CoachScreen'],
  shows: 'Answer this week’s five questions',
  scenario: checkInDueScenario,
  open: ({ state }) => state.homeTab.put('coach'),
});

export const WhyYourTargets = screenStory({
  covers: ['TargetChangeSheet'],
  shows: 'Why your targets are what they are',
  open: async ({ state, services, overlays }) => {
    state.homeTab.put('coach');
    const history = await valueOf(services.targets.watchTargetsHistory());
    void showTargetChangeSheet(overlays, services.targets, history);
  },
});

export const TargetHistory = screenStory({
  covers: ['TargetsHistoryScreen'],
  shows: 'Target history',
  open: ({ navigator }) => void navigator.push(() => <TargetsHistoryScreen />),
});

export const MonthlyReport = screenStory({
  covers: ['MonthlyReportScreen'],
  shows: 'What you did',
  open: ({ navigator }) => void navigator.push(() => <MonthlyReportScreen index={0} />),
});

export const RecoveryCheckIn = screenStory({
  covers: ['RecoveryCheckInScreen'],
  shows: 'This week',
  open: ({ navigator }) => void navigator.push(() => <RecoveryCheckInScreen />),
});

/** Two sliders under their labels, at the screen's inset (MM-240). */
export const Pause = screenStory({
  covers: ['PauseScreen'],
  shows: 'Reason',
  open: ({ navigator }) => void navigator.push(() => <PauseScreen />),
});
