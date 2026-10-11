/// One lift across a report's month (MM-33): its smoothed estimated
/// one-rep max at the first and the last session of the month.
final class ReportLift {
  const ReportLift({
    required this.name,
    required this.sessions,
    required this.fromKg,
    required this.toKg,
  });

  final String name;

  /// Sessions in the month that gave an estimate.
  final int sessions;
  final double fromKg;
  final double toKg;
}
