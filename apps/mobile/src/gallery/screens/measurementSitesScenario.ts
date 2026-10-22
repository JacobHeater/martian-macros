import { MeasurementSettings } from '../../domain/measurements/MeasurementSettings';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';

/**
 * Twelve weeks into a lean gain, measuring waist, upper arm (left) and
 * thigh weekly (MM-156): the arm up a centimetre and the thigh one and a
 * half, the waist held, so each limb's line is two facts and, with two
 * limbs up, the pair is consistent with the gain.
 */
export const measurementSitesScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(
    typicalSetup({ goalMode: 'leanGain', onboardedOn: today.addDays(-90), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }),
  );
  await repos.measurementSettings.saveMeasurementSettings(
    new MeasurementSettings({ sites: ['upperArm', 'thigh'], limbSide: 'left', suggestionAnswered: true }),
  );
  for (let i = 0; i <= 12; i++) {
    const day = today.addDays(-7 * (12 - i));
    await repos.weights.saveWeight(day, 78 + i * 0.1);
    await repos.measurements.saveMeasurement('waist', day, 84, { readings: [83.8, 84, 84.2] });
    const arm = 33 + i / 12;
    await repos.measurements.saveMeasurement('upperArm', day, arm, { readings: [arm - 0.2, arm, arm + 0.2] });
    const thigh = 57 + (1.5 * i) / 12;
    await repos.measurements.saveMeasurement('thigh', day, thigh, { readings: [thigh - 0.2, thigh, thigh + 0.2] });
  }
};
