import type { BiologicalSex } from '../domain/BiologicalSex';
import { CalendarDate } from '../domain/CalendarDate';
import type { DailyActivity } from '../domain/DailyActivity';
import type { GoalMode } from '../domain/GoalMode';
import { Profile } from '../domain/Profile';
import { ScreeningAnswers } from '../domain/ScreeningAnswers';
import { UserSetup } from '../domain/UserSetup';

/** A plausible onboarded user, for fixtures and tests. */
export function typicalSetup({
  goalMode = 'fatLoss',
  sex = 'male',
  screening = new ScreeningAnswers(),
  dailyActivity = 'light',
  onboardedOn,
  healthCheckConfirmedOn,
}: {
  goalMode?: GoalMode;
  sex?: BiologicalSex;
  screening?: ScreeningAnswers;
  dailyActivity?: DailyActivity;
  onboardedOn?: CalendarDate | undefined;
  healthCheckConfirmedOn?: CalendarDate | undefined;
} = {}): UserSetup {
  return new UserSetup({
    profile: new Profile({ sex, birthDate: CalendarDate.of(1990, 1, 1), heightCm: 180 }),
    screening,
    trainingStatus: 'novice',
    trainingDaysPerWeek: 3,
    dailyActivity,
    goalMode,
    onboardedOn: onboardedOn ?? CalendarDate.of(2026, 10, 1),
    // Old onboarding dates in fixtures should not accidentally make the
    // re-check due unless the test sets its confirmation date explicitly.
    healthCheckConfirmedOn: healthCheckConfirmedOn ?? CalendarDate.of(2026, 10, 1),
  });
}
