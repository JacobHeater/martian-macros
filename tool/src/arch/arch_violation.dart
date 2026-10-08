/// One file that breaks a structure rule.
final class ArchViolation {
  const ArchViolation({required this.path, required this.reason});

  /// Repo-relative path using `/`.
  final String path;
  final String reason;

  @override
  String toString() => '$path: $reason';
}
