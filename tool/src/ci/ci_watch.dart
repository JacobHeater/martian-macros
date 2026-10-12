import 'ci_watch_error.dart';
import 'diff_snapshots.dart';
import 'gh_failure.dart';
import 'gh_failure_kind.dart';
import 'github_reader.dart';
import 'pr_snapshot.dart';
import 'watch_event.dart';
import 'watch_id.dart';
import 'watch_store.dart';

/// Watches pull requests' checks and keeps what it sees (MM-209).
///
/// It only reads GitHub. Stored events are the truth; [notify] is a hint
/// sent after an event is on disk, and its failing loses nothing. Every
/// read here returns at once; nothing waits for CI.
final class CiWatch {
  CiWatch({
    required this.store,
    required this.reader,
    DateTime Function()? now,
    this.notify,
  }) : _now = now ?? DateTime.now;

  final WatchStore store;
  final GithubReader reader;
  final DateTime Function() _now;

  /// Told about each new event after it is stored.
  final void Function(String watchId, WatchEvent event)? notify;

  /// A heartbeat older than this many poll intervals means the background
  /// watcher is gone.
  static const staleAfterIntervals = 3;

  String _stamp() => _now().toUtc().toIso8601String();

  /// Starts watching a pull request, or returns the watch already there:
  /// one pull request has one watch. The first snapshot is taken now.
  ///
  /// [owner] is the reader who acts on its events (the chair). A watch that
  /// has no stored history, on a new machine say, starts from what GitHub
  /// shows now and says so in its first event.
  Future<Map<String, Object?>> start({
    required String repository,
    required int pr,
    required String owner,
    int intervalSeconds = 60,
  }) async {
    if (pr <= 0 || !RegExp(r'^[\w.-]+/[\w.-]+$').hasMatch(repository)) {
      throw const CiWatchError(
        'badRequest',
        'Give a repository as owner/name and a pull request number.',
      );
    }
    final id = watchId(repository, pr);
    final existed = store.exists(id);
    if (existed) {
      store.watch(id);
    } else {
      store.create(
        id,
        repository: repository,
        pr: pr,
        intervalSeconds: intervalSeconds,
        createdAt: _stamp(),
      );
      store.saveConsumer(id, {
        ...store.consumer(id),
        'owner': owner,
        'stopRequested': false,
      });
      store.append(id, [
        WatchEvent(
          id: 0,
          type: 'watchStarted',
          at: _stamp(),
          detail: {
            'owner': owner,
            'note':
                'No earlier history is stored here. What happened before '
                'this is not known to the watch; the snapshot is.',
          },
        ),
      ]);
    }
    // A stop asked for earlier no longer holds once it is started again.
    final consumer = store.consumer(id);
    if (consumer['stopRequested'] == true) {
      store.saveConsumer(id, {...consumer, 'stopRequested': false});
    }
    if (!watcherAlive(id)) await poll(id);
    return {'watchId': id, 'created': !existed, ...describe(id)};
  }

  /// Reads GitHub once and stores what changed. Returns the new events.
  /// A failure to read is recorded in the watch's health and thrown.
  Future<List<WatchEvent>> poll(
    String id, {
    int? pid,
    bool heartbeat = false,
  }) async {
    final watch = _watch(id);
    final before = store.snapshot(id);
    final health = store.health(id);
    final stamp = _stamp();
    final PrSnapshot after;
    try {
      after = await reader.read(
        watch['repository']! as String,
        watch['pr']! as int,
        _now(),
      );
    } on GhFailure catch (failure) {
      final first = health.consecutiveFailures == 0;
      final stored = first
          ? store.append(id, [
              WatchEvent(
                id: 0,
                type: 'monitorError',
                at: stamp,
                headSha: before?.headSha,
                to: failure.kind.name,
                detail: {'message': failure.message, 'action': failure.action},
              ),
            ])
          : const <WatchEvent>[];
      store.saveState(
        id,
        snapshot: before,
        health: health.copyWith(
          status: 'failing',
          lastAttempt: stamp,
          consecutiveFailures: health.consecutiveFailures + 1,
          lastError: () => failure.message,
          lastErrorKind: () => failure.kind.name,
          heartbeat: heartbeat ? () => stamp : null,
          pid: pid == null ? null : () => pid,
        ),
      );
      _tell(id, stored);
      rethrow;
    }
    final drafts = [
      if (health.consecutiveFailures > 0)
        WatchEvent(
          id: 0,
          type: 'monitorRecovered',
          at: after.observedAt,
          headSha: after.headSha,
          from: health.lastErrorKind,
        ),
      ...diffSnapshots(before, after),
    ];
    // Events first: a crash after this line loses nothing, and the same
    // poll done again adds nothing twice.
    final stored = store.append(id, drafts);
    store.saveState(
      id,
      snapshot: after,
      health: health.copyWith(
        status: heartbeat ? 'running' : health.status,
        lastSuccessfulPoll: after.observedAt,
        lastAttempt: after.observedAt,
        consecutiveFailures: 0,
        lastError: () => null,
        lastErrorKind: () => null,
        heartbeat: heartbeat ? () => after.observedAt : null,
        pid: pid == null ? null : () => pid,
      ),
    );
    _tell(id, stored);
    return stored;
  }

  void _tell(String id, List<WatchEvent> events) {
    final notify = this.notify;
    if (notify == null) return;
    for (final event in events) {
      try {
        notify(id, event);
      } on Object {
        // A hint that did not arrive. The event is stored; the next read
        // finds it.
      }
    }
  }

  List<Map<String, Object?>> list() => [
    for (final id in store.ids()) {'watchId': id, ..._safeDescribe(id)},
  ];

  Map<String, Object?> _safeDescribe(String id) {
    try {
      return describe(id);
    } on FormatException catch (e) {
      return {'incompatible': e.message};
    }
  }

  /// A watch in brief: what it watches, who owns it, how it is doing and how
  /// much each reader has left to read.
  Map<String, Object?> describe(String id) {
    final watch = _watch(id);
    final consumer = store.consumer(id);
    final events = store.events(id);
    final snapshot = store.snapshot(id);
    final cursors = (consumer['cursors'] as Map<String, Object?>?) ?? const {};
    final owner = consumer['owner'] as String?;
    final ownerCursor = cursors[owner] as int? ?? 0;
    return {
      'repository': watch['repository'],
      'pr': watch['pr'],
      'intervalSeconds': watch['intervalSeconds'],
      'owner': owner,
      'headSha': snapshot?.headSha,
      'prState': snapshot?.prState,
      'ciSummary': snapshot?.ciSummary.name,
      'lastEventId': events.lastOrNull?.id ?? 0,
      'ownerCursor': ownerCursor,
      'unreadByOwner': events.where((e) => e.id > ownerCursor).length,
      'cursors': cursors,
      'stopRequested': consumer['stopRequested'] == true,
      'watcherAlive': watcherAlive(id),
      'health': store.health(id).toJson(),
    };
  }

  /// The latest stored snapshot and how old it is. A snapshot is what was
  /// seen then; before merging, GitHub is read again ([reader]).
  Map<String, Object?> getSnapshot(String id) {
    _watch(id);
    final snapshot = store.snapshot(id);
    return {
      'watchId': id,
      'snapshot': snapshot?.toJson(),
      'ageSeconds': snapshot == null
          ? null
          : _now()
                .toUtc()
                .difference(DateTime.parse(snapshot.observedAt))
                .inSeconds,
      'watcherAlive': watcherAlive(id),
      'health': store.health(id).toJson(),
    };
  }

  /// The events after a cursor, oldest first, at once. With no [after] it
  /// continues from what [consumer] last acknowledged, so asking twice
  /// without acknowledging gives the same events twice.
  ///
  /// `gap` is true when events the reader has not seen are no longer
  /// stored; the reader must then go by the snapshot.
  Map<String, Object?> getEvents(
    String id, {
    required String consumer,
    int? after,
    int limit = 100,
  }) {
    _watch(id);
    final state = store.consumer(id);
    final cursors = (state['cursors'] as Map<String, Object?>?) ?? const {};
    final from = after ?? cursors[consumer] as int? ?? 0;
    final all = store.events(id);
    final pruned = state['prunedThrough'] as int? ?? 0;
    final unread = [
      for (final event in all)
        if (event.id > from) event,
    ];
    final page = unread.take(limit < 1 ? 1 : limit).toList();
    return {
      'watchId': id,
      'consumer': consumer,
      'owner': state['owner'],
      'after': from,
      'gap': from < pruned,
      if (from < pruned)
        'gapNote':
            'Events ${from + 1} to $pruned are no longer stored. Go by the '
            'snapshot, then acknowledge through $pruned.',
      'events': [for (final event in page) event.toJson()],
      'more': unread.length > page.length,
      'lastEventId': all.lastOrNull?.id ?? pruned,
    };
  }

  /// Records that [consumer] has dealt with every event up to [through]:
  /// processed, not merely received. Acknowledging the same events again
  /// changes nothing. Only the owner may, so two chairs cannot both act.
  Map<String, Object?> acknowledge(
    String id, {
    required String consumer,
    required int through,
  }) {
    _watch(id);
    final state = store.consumer(id);
    if (state['owner'] != consumer) {
      throw CiWatchError(
        'notOwner',
        '"$consumer" does not own this watch; "${state['owner']}" does.',
        action:
            'Read without acknowledging, or take the watch over with '
            '"mm ci own" once the other chair has stopped.',
      );
    }
    final last = store.events(id).lastOrNull?.id ?? 0;
    final cursors = {
      ...(state['cursors'] as Map<String, Object?>?) ?? const {},
    };
    final was = cursors[consumer] as int? ?? 0;
    // Never backwards, never past what exists.
    final now = through.clamp(was, last < was ? was : last);
    cursors[consumer] = now;
    store.saveConsumer(id, {...state, 'cursors': cursors});
    return {'watchId': id, 'consumer': consumer, 'cursor': now, 'was': was};
  }

  /// Hands the watch to another chair. The new owner starts from where the
  /// old one had acknowledged, so nothing dealt with is replayed as new and
  /// nothing undealt with is skipped.
  Map<String, Object?> transferOwnership(String id, {required String to}) {
    _watch(id);
    final state = store.consumer(id);
    final from = state['owner'] as String?;
    if (from == to) return {'watchId': id, 'owner': to, 'changed': false};
    final cursors = {
      ...(state['cursors'] as Map<String, Object?>?) ?? const {},
    };
    final inherited = cursors[from] as int? ?? 0;
    final own = cursors[to] as int? ?? 0;
    cursors[to] = inherited > own ? inherited : own;
    store.saveConsumer(id, {...state, 'owner': to, 'cursors': cursors});
    final stored = store.append(id, [
      WatchEvent(
        id: 0,
        type: 'ownershipTransferred',
        at: _stamp(),
        headSha: store.snapshot(id)?.headSha,
        from: from,
        to: to,
        detail: {'cursor': cursors[to]},
      ),
    ]);
    _tell(id, stored);
    return {
      'watchId': id,
      'owner': to,
      'changed': true,
      'previousOwner': from,
      'cursor': cursors[to],
    };
  }

  /// Asks the watch to stop. A background watcher sees the request at its
  /// next turn and exits; this returns at once. Events and the snapshot are
  /// kept until [delete].
  Map<String, Object?> stop(String id) {
    _watch(id);
    store.saveConsumer(id, {...store.consumer(id), 'stopRequested': true});
    return {
      'watchId': id,
      'stopRequested': true,
      'watcherAlive': watcherAlive(id),
    };
  }

  /// Removes a stopped watch and its events. Refused while a watcher runs,
  /// and while the owner has events it has not acknowledged unless [force].
  Map<String, Object?> delete(String id, {bool force = false}) {
    _watch(id);
    if (watcherAlive(id)) {
      throw const CiWatchError(
        'watcherRunning',
        'The background watcher is still running.',
        action: 'Run "mm ci stop" and try again in a moment.',
      );
    }
    final unread = describe(id)['unreadByOwner']! as int;
    if (unread > 0 && !force) {
      throw CiWatchError(
        'unreadEvents',
        '$unread event(s) have not been acknowledged by the owner.',
        action: 'Read and acknowledge them, or pass --force to drop them.',
      );
    }
    store.delete(id);
    return {'watchId': id, 'deleted': true, 'droppedUnread': unread};
  }

  /// Forgets events the owner has acknowledged. Refused while a watcher
  /// runs. Unacknowledged events are never dropped.
  Map<String, Object?> prune(String id) {
    _watch(id);
    if (watcherAlive(id)) {
      throw const CiWatchError(
        'watcherRunning',
        'The background watcher is still running.',
        action: 'Run "mm ci stop" and try again in a moment.',
      );
    }
    final through = describe(id)['ownerCursor']! as int;
    store.prune(id, through);
    return {'watchId': id, 'prunedThrough': through};
  }

  /// Whether a background watcher said it was alive recently enough.
  bool watcherAlive(String id) {
    final health = store.health(id);
    final beat = health.heartbeat;
    if (beat == null || health.status == 'stopped') return false;
    final interval = store.watch(id)['intervalSeconds'] as int? ?? 60;
    return _now().toUtc().difference(DateTime.parse(beat)).inSeconds <=
        interval * staleAfterIntervals;
  }

  /// Marks the watch as no longer being polled, with why.
  void markStopped(String id, String reason) {
    final stored = store.append(id, [
      WatchEvent(
        id: 0,
        type: 'watchStopped',
        at: _stamp(),
        headSha: store.snapshot(id)?.headSha,
        to: reason,
      ),
    ]);
    store.saveState(
      id,
      snapshot: store.snapshot(id),
      health: store.health(id).copyWith(status: 'stopped', pid: () => null),
    );
    _tell(id, stored);
  }

  bool stopRequested(String id) => store.consumer(id)['stopRequested'] == true;

  Map<String, Object?> _watch(String id) {
    if (!store.exists(id)) {
      throw CiWatchError(
        'noSuchWatch',
        'There is no watch "$id" on this machine.',
        action:
            'List them with "mm ci list". Local watch state does not travel '
            'through git: on another machine, start it again with '
            '"mm ci start <pr>", which rebuilds the snapshot from GitHub.',
      );
    }
    try {
      return store.watch(id);
    } on FormatException catch (e) {
      throw CiWatchError('incompatibleState', e.message);
    }
  }

  /// Whether a failure means polling again cannot help.
  static bool fatal(GhFailure failure) =>
      failure.kind == GhFailureKind.auth ||
      failure.kind == GhFailureKind.notFound;
}
