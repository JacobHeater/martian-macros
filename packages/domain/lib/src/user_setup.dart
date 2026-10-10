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
    this.profileRevision = 0,
    this.unitSystem = UnitSystem.imperial,
    this.bodyFatPercent,
    this.requestedLossFraction,
    this.healthCheckConfirmedOn,
    this.healthCheckSkipCount = 0,
    this.creatineStartedOn,
    this.maintenanceWeekFrom,
    this.reliefAnsweredOn,
  });

  static const healthCheckIntervalDays = 90;

  final Profile profile;
  final ScreeningAnswers screening;
  final TrainingStatus trainingStatus;
  final int trainingDaysPerWeek;

  /// Activity across the day outside workouts (MM-164).
  final DailyActivity dailyActivity;

  /// Counts corrections to sex, date of birth, height or the health check
  /// (MM-83). Targets records remember the revision they were made for; a
  /// mismatch makes the engine issue new targets at once.
  final int profileRevision;
  final GoalMode goalMode;

  /// The day coaching started; anchors the calibration week.
  final CalendarDate onboardedOn;

  final UnitSystem unitSystem;

  /// The user's own body-fat estimate, if they have one. When null the
  /// engine starts from a formula estimate with wide uncertainty.
  final double? bodyFatPercent;

  /// Chosen fat-loss pace (fraction of body weight per week), if any.
  final double? requestedLossFraction;

  /// The last day the user confirmed their health answers.
  final CalendarDate? healthCheckConfirmedOn;

  /// Consecutive skipped re-checks; two pauses deficit coaching.
  final int healthCheckSkipCount;

  /// When the user started taking creatine, if they currently take it (MM-136).
  final CalendarDate? creatineStartedOn;

  /// The day the user last chose to take a maintenance week early (MM-117).
  final CalendarDate? maintenanceWeekFrom;

  /// The day the user last answered the offer to ease a deficit, whatever
  /// they chose (MM-117). The offer is not repeated for three weeks.
  final CalendarDate? reliefAnsweredOn;

  bool healthCheckDueOn(CalendarDate today) {
    final confirmed = healthCheckConfirmedOn;
    return confirmed == null ||
        confirmed.daysUntil(today) >= healthCheckIntervalDays;
  }

  UserSetup copyWith({
    Profile? profile,
    ScreeningAnswers? screening,
    int? profileRevision,
    GoalMode? goalMode,
    UnitSystem? unitSystem,
    TrainingStatus? trainingStatus,
    int? trainingDaysPerWeek,
    DailyActivity? dailyActivity,
    double? Function()? bodyFatPercent,
    double? Function()? requestedLossFraction,
    CalendarDate? Function()? healthCheckConfirmedOn,
    int? healthCheckSkipCount,
    CalendarDate? Function()? creatineStartedOn,
    CalendarDate? maintenanceWeekFrom,
    CalendarDate? reliefAnsweredOn,
  }) => UserSetup(
    profile: profile ?? this.profile,
    screening: screening ?? this.screening,
    trainingStatus: trainingStatus ?? this.trainingStatus,
    trainingDaysPerWeek: trainingDaysPerWeek ?? this.trainingDaysPerWeek,
    dailyActivity: dailyActivity ?? this.dailyActivity,
    profileRevision: profileRevision ?? this.profileRevision,
    goalMode: goalMode ?? this.goalMode,
    onboardedOn: onboardedOn,
    unitSystem: unitSystem ?? this.unitSystem,
    bodyFatPercent: bodyFatPercent == null
        ? this.bodyFatPercent
        : bodyFatPercent(),
    requestedLossFraction: requestedLossFraction == null
        ? this.requestedLossFraction
        : requestedLossFraction(),
    healthCheckConfirmedOn: healthCheckConfirmedOn == null
        ? this.healthCheckConfirmedOn
        : healthCheckConfirmedOn(),
    healthCheckSkipCount: healthCheckSkipCount ?? this.healthCheckSkipCount,
    creatineStartedOn: creatineStartedOn == null
        ? this.creatineStartedOn
        : creatineStartedOn(),
    maintenanceWeekFrom: maintenanceWeekFrom ?? this.maintenanceWeekFrom,
    reliefAnsweredOn: reliefAnsweredOn ?? this.reliefAnsweredOn,
  );
}
