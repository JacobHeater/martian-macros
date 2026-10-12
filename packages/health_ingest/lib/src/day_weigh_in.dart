import 'weigh_in_basis.dart';

/// The one imported weigh-in that counts for a day (MM-71), with where it
/// came from and why it was the one.
final class DayWeighIn {
  const DayWeighIn({
    required this.day,
    required this.kg,
    required this.basis,
    required this.sourceName,
    required this.readings,
    this.at,
  });

  /// Midnight, local time, at the start of the day it counts for.
  final DateTime day;
  final double kg;
  final WeighInBasis basis;

  /// The source of the readings it was chosen among: one name, or "several
  /// sources" for a middle value taken across more than one.
  final String sourceName;

  /// How many readings it was chosen among.
  final int readings;

  /// When the reading was taken, for [WeighInBasis.firstMorning]. A middle
  /// value has no time of its own.
  final DateTime? at;
}
