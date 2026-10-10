import 'package:mm_domain/mm_domain.dart';

/// The fixed words of the weekly recovery check-in (MM-116).
extension RecoveryQuestionText on RecoveryQuestion {
  String get label => switch (this) {
    RecoveryQuestion.hunger => 'Hunger',
    RecoveryQuestion.energy => 'Energy',
    RecoveryQuestion.sleep => 'Sleep',
    RecoveryQuestion.training => 'Training',
    RecoveryQuestion.mood => 'Mood',
  };

  String get question => switch (this) {
    RecoveryQuestion.hunger => 'How was hunger this week?',
    RecoveryQuestion.energy => 'How was your energy through the day?',
    RecoveryQuestion.sleep => 'How well did you sleep?',
    RecoveryQuestion.training => 'How did training feel?',
    RecoveryQuestion.mood => 'How was your mood?',
  };

  /// The word at 1, the hard end.
  String get lowWord => switch (this) {
    RecoveryQuestion.hunger => 'Constant',
    RecoveryQuestion.energy => 'Drained',
    RecoveryQuestion.sleep => 'Poor',
    RecoveryQuestion.training => 'A slog',
    RecoveryQuestion.mood => 'Irritable',
  };

  /// The word at 5, the easy end.
  String get highWord => switch (this) {
    RecoveryQuestion.hunger => 'Manageable',
    RecoveryQuestion.energy => 'Steady',
    RecoveryQuestion.sleep => 'Sound',
    RecoveryQuestion.training => 'Strong',
    RecoveryQuestion.mood => 'Even',
  };
}
