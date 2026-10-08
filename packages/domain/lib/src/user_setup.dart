import 'calendar_date.dart';
import 'daily_activity.dart';
import 'goal_mode.dart';
import 'profile.dart';
import 'screening_answers.dart';
import 'training_status.dart';
import 'unit_system.dart';

/// Everything the user tells us at onboarding (and may edit later).
final class UserSetup {
  const UserSetup({
    required this.profile,
    required this.screening,
    required this.trainingStatus,
    required this.trainingDaysPerWeek,
    required this.goalMode,
    required this.onboardedOn,
    this.dailyActivity = DailyActivity.light,
    this.unitSystem = UnitSystem.imperial,
    this.bodyFatPercent,
    this.requestedLossFraction,
  });

  final Profile profile;
  final ScreeningAnswers screening;
  final TrainingStatus trainingStatus;
  final int trainingDaysPerWeek;

  /// Activity across the day outside workouts (MM-164).
  final DailyActivity dailyActivity;
  final GoalMode goalMode;

  /// The day coaching started; anchors the calibration week.
  final CalendarDate onboardedOn;

  final UnitSystem unitSystem;

  /// The user's own body-fat estimate, if they have one. When null the
  /// engine starts from a formula estimate with wide uncertainty.
  final double? bodyFatPercent;

  /// Chosen fat-loss pace (fraction of body weight per week), if any.
  final double? requestedLossFraction;

  UserSetup copyWith({
    GoalMode? goalMode,
    UnitSystem? unitSystem,
    TrainingStatus? trainingStatus,
    int? trainingDaysPerWeek,
    DailyActivity? dailyActivity,
    double? Function()? bodyFatPercent,
  }) => UserSetup(
    profile: profile,
    screening: screening,
    trainingStatus: trainingStatus ?? this.trainingStatus,
    trainingDaysPerWeek: trainingDaysPerWeek ?? this.trainingDaysPerWeek,
    dailyActivity: dailyActivity ?? this.dailyActivity,
    goalMode: goalMode ?? this.goalMode,
    onboardedOn: onboardedOn,
    unitSystem: unitSystem ?? this.unitSystem,
    bodyFatPercent: bodyFatPercent == null
        ? this.bodyFatPercent
        : bodyFatPercent(),
    requestedLossFraction: requestedLossFraction,
  );
}
