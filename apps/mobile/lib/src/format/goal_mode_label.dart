import 'package:mm_domain/mm_domain.dart';

extension GoalModeLabel on GoalMode {
  String get label => switch (this) {
    GoalMode.fatLoss => 'Fat loss',
    GoalMode.recomp => 'Recomp',
    GoalMode.leanGain => 'Lean gain',
    GoalMode.maintenance => 'Maintenance',
  };

  String get blurb => switch (this) {
    GoalMode.fatLoss => 'Lose fat at a steady pace while keeping muscle.',
    GoalMode.recomp =>
      'Hold weight roughly steady while trading fat for muscle.',
    GoalMode.leanGain => 'Build muscle in a small, controlled surplus.',
    GoalMode.maintenance => 'Hold where you are.',
  };
}
