import 'package:mm_domain/mm_domain.dart';

/// A plausible onboarded user, for fixtures and tests.
UserSetup typicalSetup({
  GoalMode goalMode = GoalMode.fatLoss,
  BiologicalSex sex = BiologicalSex.male,
  ScreeningAnswers screening = const ScreeningAnswers(),
  DailyActivity dailyActivity = DailyActivity.light,
  CalendarDate? onboardedOn,
  CalendarDate? healthCheckConfirmedOn,
}) => UserSetup(
  profile: Profile(
    sex: sex,
    birthDate: CalendarDate(1990, 1, 1),
    heightCm: 180,
  ),
  screening: screening,
  trainingStatus: TrainingStatus.novice,
  trainingDaysPerWeek: 3,
  dailyActivity: dailyActivity,
  goalMode: goalMode,
  onboardedOn: onboardedOn ?? CalendarDate(2026, 10, 1),
  // Old onboarding dates in fixtures should not accidentally make the
  // re-check due unless the test sets its confirmation date explicitly.
  healthCheckConfirmedOn: healthCheckConfirmedOn ?? CalendarDate(2026, 10, 1),
);
