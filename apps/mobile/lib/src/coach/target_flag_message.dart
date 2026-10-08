import 'package:mm_engine/mm_engine.dart';

extension TargetFlagMessage on TargetFlag {
  String get message => switch (this) {
    TargetFlag.flooredAtSafetyMinimum =>
      'Your calories are at the lowest level the app will set. Going '
          'lower risks your health and your muscle.',
    TargetFlag.rateLimited =>
      'This week’s change was limited to a small step. Targets move '
          'gradually so one odd week can’t swing them.',
    TargetFlag.dietBreak =>
      'You’ve been in a deficit for 16 weeks. This is a maintenance '
          'break to recover before continuing.',
    TargetFlag.modeNotAllowed =>
      'Your chosen goal isn’t available with your health check, so the '
          'app is holding you at maintenance.',
    TargetFlag.proteinCapped =>
      'Protein is capped because of your health check.',
  };
}
