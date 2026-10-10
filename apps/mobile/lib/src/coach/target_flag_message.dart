import 'package:mm_engine/mm_engine.dart';

extension TargetFlagMessage on TargetFlag {
  String get message => switch (this) {
    TargetFlag.flooredAtSafetyMinimum =>
      'Your calories are at the lowest level the app will set. Going '
          'lower risks your health and your muscle.',
    TargetFlag.raisedForSafePace =>
      'You were losing weight faster than the app aims for at your body '
          'fat, because faster loss costs more muscle. Targets went up.',
    TargetFlag.heldAfterSafetyRaise =>
      'Your targets went up last week because you were losing faster than '
          'the app aims for. They hold at that level this week.',
    TargetFlag.heldByUser =>
      'You kept last week’s targets. They may come down at the next '
          'check-in.',
    TargetFlag.rateLimited =>
      'This week’s change was limited to a small step. Targets move '
          'gradually so one odd week can’t swing them.',
    TargetFlag.requestedBreak =>
      'This is the maintenance week you chose. The deficit can resume at '
          'the next check-in.',
    TargetFlag.dietBreak =>
      'You’ve been in a deficit for 16 weeks. This is a maintenance '
          'break to recover before continuing.',
    TargetFlag.underweightMaintenance =>
      'Your weight is below the range where the app will plan a calorie '
          'deficit, so targets are at maintenance. If you are not eating '
          'enough, talk to a clinician.',
    TargetFlag.modeNotAllowed =>
      'Your chosen goal isn’t available with your health check, so the '
          'app is holding you at maintenance.',
    TargetFlag.proteinCapped =>
      'Protein is capped because of your health check.',
  };
}
