/// A request to the watch that could not be done, with what to do instead.
final class CiWatchError implements Exception {
  const CiWatchError(this.code, this.message, {this.action});

  /// Stable, for an agent to branch on: `noSuchWatch`, `notOwner`,
  /// `watcherRunning`, `unreadEvents`, `badRequest`, `incompatibleState` or
  /// `github`.
  final String code;
  final String message;
  final String? action;

  Map<String, Object?> toJson() => {
    'code': code,
    'message': message,
    'action': action,
  };

  @override
  String toString() => 'CiWatchError($code): $message';
}
