import 'relief_choice.dart';

/// An offer to ease a deficit because recovery is failing (MM-117). Never an
/// automatic change: the user picks, and carrying on is one of the picks.
final class ReliefOffer {
  const ReliefOffer({
    required this.suggestion,
    required this.slowerPace,
    required this.deficitWeeks,
    required this.shortSleep,
  });

  /// What the coach would pick: a maintenance week or a slower pace.
  final ReliefChoice suggestion;

  /// The pace one step gentler than the current one, as a fraction of body
  /// weight a week; null when there is none to offer.
  final double? slowerPace;

  /// Whole weeks of unbroken deficit so far.
  final int deficitWeeks;

  /// Whether reported sleep has averaged under six hours.
  final bool shortSleep;
}
