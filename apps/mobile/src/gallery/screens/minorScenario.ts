import { CalendarDate } from '../../domain/CalendarDate';
import { Profile } from '../../domain/Profile';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';

/** A stored date of birth corrected to one that makes the person sixteen. */
export const minorScenario: StoryScenario = async (repos, today) => {
  const setup = typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today });
  const profile = new Profile({ sex: 'male', birthDate: CalendarDate.of(today.year - 16, 1, 1), heightCm: 175 });
  await repos.setup.saveSetup(setup.copyWith({ profile }));
  await repos.weights.saveWeight(today, 70);
};
