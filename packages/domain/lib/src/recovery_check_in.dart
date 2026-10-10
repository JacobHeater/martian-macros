import 'calendar_date.dart';
import 'recovery_question.dart';

/// The answers of one week on how the user is holding up (MM-116).
/// Observations, never combined into a score.
final class RecoveryCheckIn {
  const RecoveryCheckIn({
    required this.date,
    required this.hunger,
    required this.energy,
    required this.sleep,
    required this.training,
    required this.mood,
    this.sleepHours,
  });

  /// The day it was answered.
  final CalendarDate date;

  /// Each from 1 (the hard end) to 5 (the easy end).
  final int hunger;
  final int energy;
  final int sleep;
  final int training;
  final int mood;

  /// Typical hours of sleep, if the user gave them.
  final double? sleepHours;

  int answer(RecoveryQuestion question) => switch (question) {
    RecoveryQuestion.hunger => hunger,
    RecoveryQuestion.energy => energy,
    RecoveryQuestion.sleep => sleep,
    RecoveryQuestion.training => training,
    RecoveryQuestion.mood => mood,
  };
}
