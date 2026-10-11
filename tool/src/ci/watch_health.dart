/// How a watch is doing, as last written by whatever polls it.
final class WatchHealth {
  const WatchHealth({
    this.status = 'idle',
    this.lastSuccessfulPoll,
    this.lastAttempt,
    this.consecutiveFailures = 0,
    this.lastError,
    this.lastErrorKind,
    this.heartbeat,
    this.pid,
  });

  factory WatchHealth.fromJson(Map<String, Object?> json) => WatchHealth(
    status: json['status'] as String? ?? 'idle',
    lastSuccessfulPoll: json['lastSuccessfulPoll'] as String?,
    lastAttempt: json['lastAttempt'] as String?,
    consecutiveFailures: json['consecutiveFailures'] as int? ?? 0,
    lastError: json['lastError'] as String?,
    lastErrorKind: json['lastErrorKind'] as String?,
    heartbeat: json['heartbeat'] as String?,
    pid: json['pid'] as int?,
  );

  /// `idle` (nothing is polling), `running`, `failing` (the last poll
  /// failed and it is retrying) or `stopped`.
  final String status;
  final String? lastSuccessfulPoll;
  final String? lastAttempt;
  final int consecutiveFailures;
  final String? lastError;
  final String? lastErrorKind;

  /// When the background watcher last said it was alive.
  final String? heartbeat;
  final int? pid;

  WatchHealth copyWith({
    String? status,
    String? lastSuccessfulPoll,
    String? lastAttempt,
    int? consecutiveFailures,
    String? Function()? lastError,
    String? Function()? lastErrorKind,
    String? Function()? heartbeat,
    int? Function()? pid,
  }) => WatchHealth(
    status: status ?? this.status,
    lastSuccessfulPoll: lastSuccessfulPoll ?? this.lastSuccessfulPoll,
    lastAttempt: lastAttempt ?? this.lastAttempt,
    consecutiveFailures: consecutiveFailures ?? this.consecutiveFailures,
    lastError: lastError == null ? this.lastError : lastError(),
    lastErrorKind: lastErrorKind == null ? this.lastErrorKind : lastErrorKind(),
    heartbeat: heartbeat == null ? this.heartbeat : heartbeat(),
    pid: pid == null ? this.pid : pid(),
  );

  Map<String, Object?> toJson() => {
    'status': status,
    'lastSuccessfulPoll': lastSuccessfulPoll,
    'lastAttempt': lastAttempt,
    'consecutiveFailures': consecutiveFailures,
    'lastError': lastError,
    'lastErrorKind': lastErrorKind,
    'heartbeat': heartbeat,
    'pid': pid,
  };
}
