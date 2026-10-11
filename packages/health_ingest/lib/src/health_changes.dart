import 'health_sample.dart';

/// What changed on the platform since a token was issued (MM-67).
final class HealthChanges {
  const HealthChanges({
    required this.nextToken,
    this.upserted = const [],
    this.deletedIds = const [],
    this.tokenExpired = false,
  });

  /// The platform no longer honors the token asked with: nothing is known
  /// of what changed, and everything has to be read again from no token.
  const HealthChanges.expired()
    : nextToken = '',
      upserted = const [],
      deletedIds = const [],
      tokenExpired = true;

  /// Readings added or edited, each in its latest state.
  final List<HealthSample> upserted;

  /// The platform ids of readings deleted.
  final List<String> deletedIds;

  /// What to ask with next time. Empty when [tokenExpired].
  final String nextToken;
  final bool tokenExpired;
}
