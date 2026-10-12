import 'gh_failure_kind.dart';

/// GitHub could not be read. [message] is safe to store and show: it holds
/// no token and at most a short, single line of what `gh` said.
final class GhFailure implements Exception {
  const GhFailure(this.kind, this.message);

  final GhFailureKind kind;
  final String message;

  /// What to do about it.
  String get action => switch (kind) {
    GhFailureKind.auth => 'Run "gh auth status", then "gh auth login".',
    GhFailureKind.rateLimit =>
      'Wait for the rate limit to reset; the watch backs off by itself.',
    GhFailureKind.notFound => 'Check the repository and pull request number.',
    GhFailureKind.headUnstable => 'Read again once pushes have stopped.',
    GhFailureKind.other => 'Check the network and "gh --version"; then retry.',
  };

  @override
  String toString() => 'GhFailure(${kind.name}): $message';
}
