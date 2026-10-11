/// A session that gave a lift its best estimated one-rep max so far
/// (MM-92): earned in training, and the one thing the app marks loudly.
final class PersonalRecord {
  const PersonalRecord({
    required this.exerciseId,
    required this.name,
    required this.estimateKg,
    required this.previousBestKg,
  });

  final String exerciseId;
  final String name;

  /// The session's best estimate, and the best of every session before it.
  final double estimateKg;
  final double previousBestKg;
}
