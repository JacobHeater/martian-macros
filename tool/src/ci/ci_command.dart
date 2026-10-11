import 'dart:convert';
import 'dart:io';

import 'ci_watch.dart';
import 'ci_watch_error.dart';
import 'gh_failure.dart';
import 'gh_runner.dart';
import 'github_reader.dart';
import 'process_gh_runner.dart';
import 'watch_id.dart';
import 'watch_loop.dart';
import 'watch_store.dart';

const _usage = '''
mm ci: watch pull request checks without waiting for them (MM-209).
Every command prints one JSON object and returns at once, except "run".

  mm ci start <pr> --owner <id> [--repo owner/name] [--interval 60]
                                  Start (or rejoin) the watch and its
                                  background watcher. [--no-watcher] takes
                                  one snapshot and leaves polling to you.
  mm ci list                      Every watch on this machine.
  mm ci snapshot <watch>          The latest stored snapshot.
  mm ci events <watch> --consumer <id> [--after N] [--limit 100]
                                  Events after the cursor; does not wait.
  mm ci ack <watch> --consumer <id> --through N
                                  Mark events as dealt with (owner only).
  mm ci poll <watch>              Read GitHub once now (no watcher needed).
  mm ci check <pr> [--repo owner/name]
                                  Read GitHub now, storing nothing: what to
                                  go by before merging.
  mm ci own <watch> --consumer <id>
                                  Take the watch over from another chair.
  mm ci stop <watch> [--delete] [--force]
                                  Ask the watcher to stop.
  mm ci prune <watch>             Forget acknowledged events.
  mm ci next <watch> --consumer <id> [--timeout 600]
                                  Optional: return when there is an unread
                                  event, or at the timeout. For a host that
                                  reports finished background commands.
  mm ci run <watch>               The watcher itself (started by "start").
''';

/// The `mm ci` command. [gh] is replaced in tests.
Future<int> runCi(Directory repoRoot, List<String> args, {GhRunner? gh}) async {
  if (args.isEmpty || args.first == 'help' || args.first == '--help') {
    stdout.write(_usage);
    return args.isEmpty ? 64 : 0;
  }
  final store = WatchStore(
    Directory('${repoRoot.path}/${WatchStore.relativePath}'),
  );
  final reader = GithubReader(gh ?? const ProcessGhRunner());
  final watch = CiWatch(store: store, reader: reader);
  final verb = args.first;
  final rest = args.skip(1).toList();
  String? option(String name) {
    final i = rest.indexOf('--$name');
    return i == -1 || i + 1 >= rest.length ? null : rest[i + 1];
  }

  bool flag(String name) => rest.contains('--$name');
  String? positional() =>
      rest.isEmpty || rest.first.startsWith('--') ? null : rest.first;
  String need(String? value, String what) =>
      value ??
      (throw CiWatchError('badRequest', 'Missing $what.', action: _usage));
  int number(String? value, String what) =>
      int.tryParse(need(value, what)) ??
      (throw CiWatchError('badRequest', '$what must be a number.'));

  try {
    Map<String, Object?> result;
    switch (verb) {
      case 'start':
        final pr = number(positional(), 'the pull request number');
        final repository = option('repo') ?? await reader.currentRepository();
        result = await watch.start(
          repository: repository,
          pr: pr,
          owner: need(option('owner'), '--owner'),
          intervalSeconds: option('interval') == null
              ? 60
              : number(option('interval'), '--interval').clamp(15, 3600),
        );
        final id = watchId(repository, pr);
        final open = store.snapshot(id)?.open ?? true;
        if (!flag('no-watcher') && open && !watch.watcherAlive(id)) {
          final process = await Process.start(
            Platform.resolvedExecutable,
            [Platform.script.toFilePath(), 'ci', 'run', id],
            mode: ProcessStartMode.detached,
            workingDirectory: repoRoot.path,
          );
          result['watcherStarted'] = true;
          result['watcherPid'] = process.pid;
        } else {
          result['watcherStarted'] = false;
        }
      case 'list':
        result = {'watches': watch.list()};
      case 'snapshot':
        result = watch.getSnapshot(need(positional(), 'the watch id'));
      case 'events':
        result = watch.getEvents(
          need(positional(), 'the watch id'),
          consumer: need(option('consumer'), '--consumer'),
          after: option('after') == null
              ? null
              : number(option('after'), '--after'),
          limit: option('limit') == null
              ? 100
              : number(option('limit'), '--limit'),
        );
      case 'ack':
        result = watch.acknowledge(
          need(positional(), 'the watch id'),
          consumer: need(option('consumer'), '--consumer'),
          through: number(option('through'), '--through'),
        );
      case 'poll':
        final id = need(positional(), 'the watch id');
        if (watch.watcherAlive(id)) {
          throw const CiWatchError(
            'watcherRunning',
            'A background watcher is already polling this watch.',
            action: 'Read its events with "mm ci events".',
          );
        }
        final events = await watch.poll(id);
        result = {
          'watchId': id,
          'newEvents': [for (final event in events) event.toJson()],
          ...watch.getSnapshot(id),
        };
      case 'check':
        final pr = number(positional(), 'the pull request number');
        final repository = option('repo') ?? await reader.currentRepository();
        final snapshot = await reader.read(repository, pr, DateTime.now());
        result = {'live': true, 'stored': false, 'snapshot': snapshot.toJson()};
      case 'own':
        result = watch.transferOwnership(
          need(positional(), 'the watch id'),
          to: need(option('consumer'), '--consumer'),
        );
      case 'stop':
        final id = need(positional(), 'the watch id');
        result = watch.stop(id);
        if (flag('delete')) {
          result = {...result, ...watch.delete(id, force: flag('force'))};
        }
      case 'prune':
        result = watch.prune(need(positional(), 'the watch id'));
      case 'next':
        final id = need(positional(), 'the watch id');
        final consumer = need(option('consumer'), '--consumer');
        final timeout = Duration(
          seconds: option('timeout') == null
              ? 600
              : number(option('timeout'), '--timeout').clamp(1, 3600),
        );
        final until = DateTime.now().add(timeout);
        var events = watch.getEvents(id, consumer: consumer);
        while ((events['events']! as List).isEmpty &&
            DateTime.now().isBefore(until) &&
            watch.watcherAlive(id)) {
          await Future<void>.delayed(const Duration(seconds: 2));
          events = watch.getEvents(id, consumer: consumer);
        }
        result = {...events, 'watcherAlive': watch.watcherAlive(id)};
      case 'run':
        final id = need(positional(), 'the watch id');
        if (watch.watcherAlive(id)) {
          throw const CiWatchError(
            'watcherRunning',
            'A background watcher is already polling this watch.',
          );
        }
        final reason = await WatchLoop(
          watch: watch,
          sleep: Future<void>.delayed,
          now: DateTime.now,
          pid: pid,
        ).run(id);
        result = {'watchId': id, 'stopped': reason};
      default:
        throw CiWatchError(
          'badRequest',
          'Unknown command "$verb".',
          action: _usage,
        );
    }
    _print({'schema': WatchStore.schemaVersion, 'ok': true, ...result});
    return 0;
  } on CiWatchError catch (error) {
    _print({
      'schema': WatchStore.schemaVersion,
      'ok': false,
      'error': error.toJson(),
    });
    return error.code == 'badRequest' ? 64 : 1;
  } on GhFailure catch (failure) {
    _print({
      'schema': WatchStore.schemaVersion,
      'ok': false,
      'error': {
        'code': 'github',
        'kind': failure.kind.name,
        'message': failure.message,
        'action': failure.action,
      },
    });
    return 1;
  }
}

void _print(Map<String, Object?> json) =>
    stdout.writeln(const JsonEncoder.withIndent('  ').convert(json));
