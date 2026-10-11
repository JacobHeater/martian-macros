/// The platform could not be read just now (MM-68): the app is not in the
/// foreground, a permission went away mid-read, or the platform failed.
///
/// A source throws this rather than answer "nothing". An empty answer is a
/// claim that there are no readings, and acting on it would remove the
/// ones already kept.
final class HealthReadFailure implements Exception {
  const HealthReadFailure(this.what);

  /// What was being read, for a log; never a reading.
  final String what;

  @override
  String toString() => 'HealthReadFailure: $what';
}
