import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';

/**
 * A woman on fat loss whose cycles ran about every 29 days, none marked for
 * 46 (MM-116): this week's recovery check-in asks whether that is expected.
 */
export const missedPeriodScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(
    typicalSetup({ sex: 'female', onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }),
  );
  await repos.weights.saveWeight(today, 68);
  for (const ago of [104, 75, 46]) {
    for (let d = 0; d < 4; d++) await repos.flowDays.markFlowDay(today.addDays(-ago + d));
  }
};
