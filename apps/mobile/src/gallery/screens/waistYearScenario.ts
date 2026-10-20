import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';

/**
 * Thirty weekly waist measurements, the middle of three each time but one
 * quick entry, the tape down three centimetres over the stretch (MM-155):
 * the waist chart with a year to show and the protocol one tap down.
 */
export const waistYearScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-220), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  for (let week = 29; week >= 0; week--) {
    const cm = 94 - (29 - week) * 0.1 + (week % 4 === 1 ? 0.5 : 0);
    const readings = week === 12 ? [cm] : [cm - 0.5, cm, cm + 0.5];
    await repos.waist.saveWaist(today.addDays(-7 * week), cm, { readings });
  }
};
