import 'dart:convert';
import 'dart:io';

import 'pr_snapshot.dart';
import 'watch_event.dart';
import 'watch_health.dart';

/// The files of the watches, under one directory that is never committed.
///
/// Each watch has four files, each with one kind of writer, so that a poll
/// and an acknowledgement at the same moment cannot overwrite each other:
/// - `watch.json`: what is watched. Written when the watch is created.
/// - `state.json`: the latest snapshot and health. Written by the poller.
/// - `events.jsonl`: the events, one per line, appended by the poller.
/// - `consumer.json`: the owner, each reader's cursor and the stop request.
///   Written by the agent-facing commands.
///
/// Whole files are replaced by writing a new one beside them and renaming
/// it, so a crash leaves the old file or the new one, never half of one.
base class WatchStore {
  WatchStore(this.root);

  /// The stored format. A file with another version is refused, not guessed
  /// at.
  static const schemaVersion = 1;

  /// Where the watches live, under the repository root.
  static const relativePath = '.mm/ci-watch';

  final Directory root;

  Directory _dir(String id) => Directory('${root.path}/$id');
  File _file(String id, String name) => File('${_dir(id).path}/$name');

  bool exists(String id) => _file(id, 'watch.json').existsSync();

  List<String> ids() {
    if (!root.existsSync()) return const [];
    return [
      for (final dir in root.listSync().whereType<Directory>())
        if (File('${dir.path}/watch.json').existsSync())
          dir.uri.pathSegments.lastWhere((s) => s.isNotEmpty),
    ]..sort();
  }

  void create(
    String id, {
    required String repository,
    required int pr,
    required int intervalSeconds,
    required String createdAt,
  }) {
    _dir(id).createSync(recursive: true);
    _write(id, 'watch.json', {
      'schema': schemaVersion,
      'watchId': id,
      'repository': repository,
      'pr': pr,
      'intervalSeconds': intervalSeconds,
      'createdAt': createdAt,
    });
  }

  /// What is watched. Throws [FormatException] for a format this version
  /// does not know.
  Map<String, Object?> watch(String id) {
    final json = _read(id, 'watch.json');
    if (json == null) throw FormatException('No watch "$id".');
    if (json['schema'] != schemaVersion) {
      throw FormatException(
        'Watch "$id" was stored in format ${json['schema']}; this version '
        'reads format $schemaVersion. Stop it and start it again.',
      );
    }
    return json;
  }

  PrSnapshot? snapshot(String id) {
    final json = _read(id, 'state.json')?['snapshot'];
    return json is Map<String, Object?> ? PrSnapshot.fromJson(json) : null;
  }

  WatchHealth health(String id) {
    final json = _read(id, 'state.json')?['health'];
    return json is Map<String, Object?>
        ? WatchHealth.fromJson(json)
        : const WatchHealth();
  }

  void saveState(
    String id, {
    PrSnapshot? snapshot,
    required WatchHealth health,
  }) {
    _write(id, 'state.json', {
      'schema': schemaVersion,
      'snapshot': snapshot?.toJson(),
      'health': health.toJson(),
    });
  }

  /// Every stored event, oldest first. A last line cut short by a crash is
  /// not an event and is left out.
  List<WatchEvent> events(String id) {
    final file = _file(id, 'events.jsonl');
    if (!file.existsSync()) return const [];
    final events = <WatchEvent>[];
    for (final line in const LineSplitter().convert(file.readAsStringSync())) {
      if (line.trim().isEmpty) continue;
      try {
        final json = jsonDecode(line);
        if (json is Map<String, Object?>) events.add(WatchEvent.fromJson(json));
      } on FormatException {
        // An interrupted write. Nothing after it can be trusted either.
        break;
      } on TypeError {
        break;
      }
    }
    return events;
  }

  /// Stores [drafts] after the events already there, giving each the next
  /// id, and returns them as stored. They are on disk when this returns.
  ///
  /// A draft whose change is already stored for the latest snapshot is left
  /// out, so a poll repeated after a crash adds nothing twice.
  List<WatchEvent> append(String id, List<WatchEvent> drafts) {
    if (drafts.isEmpty) return const [];
    final file = _file(id, 'events.jsonl');
    final existing = events(id);
    _dropTornTail(file, existing);
    var next = (existing.lastOrNull?.id ?? _prunedThrough(id)) + 1;
    // What a previous, interrupted poll already stored about this same
    // observation.
    final lastSaved = snapshot(id)?.observedAt;
    final repeated = {
      for (final event in existing)
        if (lastSaved == null || event.at.compareTo(lastSaved) > 0)
          event.dedupeKey,
    };
    final stored = <WatchEvent>[];
    final sink = file.openSync(mode: FileMode.append);
    try {
      for (final draft in drafts) {
        if (repeated.contains(draft.dedupeKey)) continue;
        final event = draft.withId(next++);
        sink.writeStringSync('${jsonEncode(event.toJson())}\n');
        stored.add(event);
      }
      sink.flushSync();
    } finally {
      sink.closeSync();
    }
    return stored;
  }

  /// Removes a half-written last line, so the next event starts on its own.
  void _dropTornTail(File file, List<WatchEvent> whole) {
    if (!file.existsSync()) return;
    final text = file.readAsStringSync();
    final lines = const LineSplitter()
        .convert(text)
        .where((l) => l.trim().isNotEmpty)
        .length;
    if (lines == whole.length && (text.isEmpty || text.endsWith('\n'))) return;
    _replace(
      file,
      [for (final event in whole) '${jsonEncode(event.toJson())}\n'].join(),
    );
  }

  /// Who owns the watch, where each reader has got to, and whether it was
  /// asked to stop.
  Map<String, Object?> consumer(String id) =>
      _read(id, 'consumer.json') ??
      {
        'schema': schemaVersion,
        'owner': null,
        'cursors': <String, Object?>{},
        'stopRequested': false,
        'prunedThrough': 0,
      };

  void saveConsumer(String id, Map<String, Object?> consumer) =>
      _write(id, 'consumer.json', {...consumer, 'schema': schemaVersion});

  int _prunedThrough(String id) => consumer(id)['prunedThrough'] as int? ?? 0;

  /// Forgets the events up to and including [through]. Only for a watch
  /// nothing is polling; the caller checks that and that they were read.
  void prune(String id, int through) {
    final kept = [
      for (final event in events(id))
        if (event.id > through) event,
    ];
    _replace(
      _file(id, 'events.jsonl'),
      [for (final event in kept) '${jsonEncode(event.toJson())}\n'].join(),
    );
    saveConsumer(id, {...consumer(id), 'prunedThrough': through});
  }

  void delete(String id) {
    final dir = _dir(id);
    if (dir.existsSync()) dir.deleteSync(recursive: true);
  }

  Map<String, Object?>? _read(String id, String name) {
    final file = _file(id, name);
    if (!file.existsSync()) return null;
    try {
      final json = jsonDecode(file.readAsStringSync());
      return json is Map<String, Object?> ? json : null;
    } on FormatException {
      return null;
    }
  }

  void _write(String id, String name, Map<String, Object?> json) => _replace(
    _file(id, name),
    '${const JsonEncoder.withIndent('  ').convert(json)}\n',
  );

  static void _replace(File file, String content) {
    final temp = File('${file.path}.tmp');
    temp.writeAsStringSync(content, flush: true);
    temp.renameSync(file.path);
  }
}
