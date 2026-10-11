/// One meaningful change seen by a watch. Events are stored before anything
/// is told about them, and their ids only ever go up within a watch.
final class WatchEvent {
  const WatchEvent({
    required this.id,
    required this.type,
    required this.at,
    this.headSha,
    this.check,
    this.from,
    this.to,
    this.detail = const {},
  });

  factory WatchEvent.fromJson(Map<String, Object?> json) => WatchEvent(
    id: json['id']! as int,
    type: json['type']! as String,
    at: json['at']! as String,
    headSha: json['headSha'] as String?,
    check: json['check'] as String?,
    from: json['from'] as String?,
    to: json['to'] as String?,
    detail: (json['detail'] as Map<String, Object?>?) ?? const {},
  );

  /// 0 until the store assigns one.
  final int id;

  /// `watchStarted`, `headChanged`, `checkChanged`, `ciSummaryChanged`,
  /// `requiredSummaryChanged`, `requiredDiscoveryChanged`, `prStateChanged`,
  /// `monitorError`, `monitorRecovered`, `ownershipTransferred` or
  /// `watchStopped`.
  final String type;

  /// When it was observed, UTC, ISO 8601.
  final String at;

  /// The head commit the event is about.
  final String? headSha;

  /// The check's key, for `checkChanged`.
  final String? check;

  /// The old and new state, in the vocabulary of the event's type.
  final String? from;
  final String? to;
  final Map<String, Object?> detail;

  /// The same change observed twice has the same key, so a poll repeated
  /// after a crash does not store it again.
  String get dedupeKey => '$type|$headSha|$check|$from|$to';

  WatchEvent withId(int id) => WatchEvent(
    id: id,
    type: type,
    at: at,
    headSha: headSha,
    check: check,
    from: from,
    to: to,
    detail: detail,
  );

  Map<String, Object?> toJson() => {
    'id': id,
    'type': type,
    'at': at,
    'headSha': headSha,
    'check': check,
    'from': from,
    'to': to,
    if (detail.isNotEmpty) 'detail': detail,
  };
}
