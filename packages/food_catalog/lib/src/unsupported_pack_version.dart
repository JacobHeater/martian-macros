/// A pack this app cannot read safely.
final class UnsupportedPackVersion implements Exception {
  const UnsupportedPackVersion({required this.found, required this.supported});

  final int found;
  final int supported;

  String get message =>
      'This food pack uses format $found; this app reads format $supported. '
      'Update the app or download a matching pack.';

  @override
  String toString() => message;
}
