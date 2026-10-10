/// The thresholds for how protein is spread across meals (MM-125).
/// Judgement: spreading it may help slightly; the daily total matters much
/// more. Tune them here.
abstract final class ProteinSpreadRule {
  /// A meal with at least this much protein per kg of body weight carries
  /// the quiet marker.
  static const markerGPerKg = 0.3;

  /// A meal with less protein than this has almost none.
  static const almostNoneG = 10.0;
}
