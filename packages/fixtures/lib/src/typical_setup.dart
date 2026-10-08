import 'package:mm_domain/mm_domain.dart';

/// A plausible onboarded user, for fixtures and tests.
UserSetup typicalSetup({
  GoalMode goalMode = GoalMode.fatLoss,
  BiologicalSex sex = BiologicalSex.male,
  ScreeningAnswers screening = const ScreeningAnswers(),
  CalendarDate? onboardedOn,
}) => UserSetup(
  profile: Profile(
    sex: sex,
    birthDate: CalendarDate(1990, 1, 1),
    heightCm: 180,
  ),
  screening: screening,
  trainingStatus: TrainingStatus.novice,
  trainingDaysPerWeek: 3,
  goalMode: goalMode,
  onboardedOn: onboardedOn ?? CalendarDate(2026, 10, 1),
);
