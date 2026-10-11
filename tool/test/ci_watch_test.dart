import 'dart:io';

import 'package:test/test.dart';

import '../src/ci/check_state.dart';
import '../src/ci/ci_command.dart';
import '../src/ci/ci_summary.dart';
import '../src/ci/ci_watch.dart';
import '../src/ci/ci_watch_error.dart';
import '../src/ci/gh_failure.dart';
import '../src/ci/gh_failure_kind.dart';
import '../src/ci/gh_result.dart';
import '../src/ci/github_reader.dart';
import '../src/ci/normalize_check_state.dart';
import '../src/ci/pr_snapshot.dart';
import '../src/ci/required_discovery.dart';
import '../src/ci/watch_event.dart';
import '../src/ci/watch_health.dart';
import '../src/ci/watch_loop.dart';
import '../src/ci/watch_store.dart';
import 'support/crashing_store.dart';
import 'support/fake_gh.dart';

/// MM-209: watching pull request checks without waiting for them. GitHub is
/// simulated throughout by [FakeGh]; nothing here touches the network.
void main() {
  late Directory dir;
  late FakeGh gh;
  late DateTime clock;
  late CiWatch watch;
  const id = 'octo-app-pr7';
  const chair = 'claude-chair';

  CiWatch open({
    void Function(String, WatchEvent)? notify,
    WatchStore? store,
  }) => CiWatch(
    store: store ?? WatchStore(dir),
    reader: GithubReader(gh),
    now: () => clock,
    notify: notify,
  );

  /// Lets time pass and reads GitHub once.
  Future<List<WatchEvent>> poll([CiWatch? using]) {
    clock = clock.add(const Duration(minutes: 1));
    return (using ?? watch).poll(id);
  }

  Future<void> start() =>
      watch.start(repository: 'octo/app', pr: 7, owner: chair);

  List<String> types(List<WatchEvent> events) => [
    for (final event in events) event.type,
  ];

  List<WatchEvent> unread({String consumer = chair, int? after}) => [
    for (final event
        in watch.getEvents(id, consumer: consumer, after: after)['events']!
            as List<Object?>)
      WatchEvent.fromJson(event! as Map<String, Object?>),
  ];

  PrSnapshot snapshot() => watch.store.snapshot(id)!;

  setUp(() {
    dir = Directory.systemTemp.createTempSync('mm_ci_watch');
    gh = FakeGh();
    clock = DateTime.utc(2026, 10, 11, 10);
    watch = open();
  });
  tearDown(() => dir.deleteSync(recursive: true));

  group('check states', () {
    test('GitHub\'s words are normalized, and unknown ones stay unknown', () {
      expect(normalizeCheckState('QUEUED', ''), CheckState.pending);
      expect(normalizeCheckState('IN_PROGRESS', ''), CheckState.running);
      expect(normalizeCheckState('WAITING', ''), CheckState.actionRequired);
      expect(normalizeCheckState('COMPLETED', 'SUCCESS'), CheckState.passed);
      expect(normalizeCheckState('COMPLETED', 'FAILURE'), CheckState.failed);
      expect(
        normalizeCheckState('COMPLETED', 'STARTUP_FAILURE'),
        CheckState.failed,
      );
      expect(
        normalizeCheckState('COMPLETED', 'CANCELLED'),
        CheckState.cancelled,
      );
      expect(normalizeCheckState('COMPLETED', 'SKIPPED'), CheckState.skipped);
      expect(normalizeCheckState('COMPLETED', 'NEUTRAL'), CheckState.neutral);
      expect(
        normalizeCheckState('COMPLETED', 'TIMED_OUT'),
        CheckState.timedOut,
      );
      expect(
        normalizeCheckState('COMPLETED', 'ACTION_REQUIRED'),
        CheckState.actionRequired,
      );
      expect(normalizeCheckState('COMPLETED', 'STALE'), CheckState.stale);
      expect(
        normalizeCheckState('COMPLETED', 'SOMETHING_NEW'),
        CheckState.unknown,
      );
      expect(normalizeCheckState('SOMETHING_NEW', ''), CheckState.unknown);
      expect(normalizeCheckState(null, null), CheckState.unknown);
      // Commit statuses.
      expect(normalizeCheckState('SUCCESS', null), CheckState.passed);
      expect(normalizeCheckState('ERROR', null), CheckState.failed);
      expect(normalizeCheckState('EXPECTED', null), CheckState.pending);
    });
  });

  group('reading GitHub', () {
    Future<PrSnapshot> read() => GithubReader(gh).read('octo/app', 7, clock);

    test('no checks is not the same as passed', () async {
      final seen = await read();
      expect(seen.ciSummary, CiSummary.none);
      expect(seen.checks, isEmpty);
    });

    test('check runs and commit statuses are both observed', () async {
      gh.rollup = [
        FakeGh.checkRun('check', conclusion: 'SUCCESS'),
        FakeGh.status('deploy/preview', 'PENDING'),
      ];
      final seen = await read();
      expect(
        [for (final c in seen.checks) c.key],
        ['CI / check', 'deploy/preview'],
      );
      expect(seen.checks.first.kind, 'checkRun');
      expect(seen.checks.first.url, contains('/actions/runs/7/job/1'));
      expect(seen.checks.first.providerConclusion, 'SUCCESS');
      expect(seen.checks.last.kind, 'statusContext');
      expect(seen.checks.last.state, CheckState.pending);
      expect(seen.ciSummary, CiSummary.pending);
    });

    test(
      'skipped and neutral checks do not make a pass by themselves',
      () async {
        gh.rollup = [
          FakeGh.checkRun('lint', conclusion: 'SKIPPED'),
          FakeGh.checkRun('docs', conclusion: 'NEUTRAL'),
        ];
        expect((await read()).ciSummary, CiSummary.inconclusive);

        gh.rollup.add(FakeGh.checkRun('check', conclusion: 'SUCCESS'));
        final seen = await read();
        expect(seen.ciSummary, CiSummary.passed);
        expect(seen.counts, {'skipped': 1, 'neutral': 1, 'passed': 1});
      },
    );

    test('cancelled, timed out and action required are told apart', () async {
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'CANCELLED')];
      expect((await read()).ciSummary, CiSummary.cancelled);
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'ACTION_REQUIRED')];
      expect((await read()).ciSummary, CiSummary.blocked);
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'TIMED_OUT')];
      expect((await read()).ciSummary, CiSummary.failed);
      gh.rollup = [FakeGh.checkRun('check', status: 'MYSTERY')];
      expect((await read()).ciSummary, CiSummary.unknown);
    });

    test('of several attempts at a check, the last started counts', () async {
      gh.rollup = [
        FakeGh.checkRun('check', conclusion: 'FAILURE', job: 1),
        FakeGh.checkRun(
          'check',
          conclusion: 'SUCCESS',
          startedAt: '2026-10-11T10:20:00Z',
          job: 2,
        ),
      ];
      final seen = await read();
      expect(seen.checks, hasLength(1));
      expect(seen.checks.single.state, CheckState.passed);
      expect(seen.checks.single.url, endsWith('/job/2'));
    });

    test('required checks are marked, and summed up separately', () async {
      gh.rollup = [
        FakeGh.checkRun('check', conclusion: 'SUCCESS'),
        FakeGh.checkRun('optional', conclusion: 'FAILURE'),
      ];
      gh.required = [
        {'name': 'check', 'workflow': 'CI'},
      ];
      final seen = await read();
      expect(seen.requiredDiscovery, RequiredDiscovery.discovered);
      expect([for (final c in seen.checks) c.required], [true, false]);
      expect(seen.requiredSummary, CiSummary.passed);
      expect(seen.ciSummary, CiSummary.failed);
    });

    test(
      '"no required checks reported" is said as that, not as passed',
      () async {
        gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
        final seen = await read();
        expect(seen.requiredDiscovery, RequiredDiscovery.noneReported);
        expect(seen.requiredSummary, isNull);
      },
    );

    test('when what is required cannot be told, it is unknown', () async {
      gh.required = const GhResult(
        exitCode: 1,
        stderr: 'HTTP 502: bad gateway',
      );
      final seen = await read();
      expect(seen.requiredDiscovery, RequiredDiscovery.unknown);
      expect(seen.requiredSummary, isNull);
    });

    test('a head that moves mid-read is read again, never mixed', () async {
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
      gh.headsOnRecheck.add('b2');
      final seen = await read();
      expect(seen.headSha, 'b2');
      // The full read was done twice.
      expect(
        gh.calls.where((c) => c.last.contains('statusCheckRollup')),
        hasLength(2),
      );
    });

    test('a head that never settles is an error, not a guess', () async {
      gh.headsOnRecheck.addAll(['b', 'c', 'd', 'e']);
      await expectLater(
        read(),
        throwsA(
          isA<GhFailure>().having(
            (f) => f.kind,
            'kind',
            GhFailureKind.headUnstable,
          ),
        ),
      );
    });

    test('failures are told apart and say what to do', () async {
      Future<GhFailure> failing(String stderr) async {
        gh.failure = GhResult(exitCode: 1, stderr: stderr);
        try {
          await read();
        } on GhFailure catch (failure) {
          return failure;
        }
        fail('expected a failure');
      }

      final auth = await failing(
        'To get started with GitHub CLI, please run:  gh auth login',
      );
      expect(auth.kind, GhFailureKind.auth);
      expect(auth.action, contains('gh auth'));
      expect(
        (await failing('HTTP 403: API rate limit exceeded')).kind,
        GhFailureKind.rateLimit,
      );
      expect(
        (await failing('GraphQL: Could not resolve to a PullRequest')).kind,
        GhFailureKind.notFound,
      );
      expect((await failing('dial tcp: timeout')).kind, GhFailureKind.other);
    });

    test('nothing shaped like a credential is kept from an error', () async {
      gh.failure = const GhResult(
        exitCode: 1,
        stderr: 'error: token=ghp_abcdefghij1234567890 rejected\nsecond line',
      );
      try {
        await read();
        fail('expected a failure');
      } on GhFailure catch (failure) {
        expect(failure.message, isNot(contains('ghp_')));
        expect(failure.message, isNot(contains('second line')));
      }
    });

    test('arguments go to gh as a list, with the repository named', () async {
      await read();
      for (final call in gh.calls) {
        expect(call, containsAllInOrder(['--repo', 'octo/app']));
      }
      expect(gh.calls.any((c) => c.contains('--required')), isTrue);
    });
  });

  group('events', () {
    test('pending, then running, then passed', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      expect(types(unread()), [
        'watchStarted',
        'checkChanged',
        'ciSummaryChanged',
        'requiredDiscoveryChanged',
      ]);

      gh.rollup = [FakeGh.checkRun('check', status: 'IN_PROGRESS')];
      final running = await poll();
      // Running is still pending overall: one change, not two.
      expect(types(running), ['checkChanged']);
      expect(running.single.from, 'pending');
      expect(running.single.to, 'running');
      expect(running.single.detail['url'], contains('/job/1'));

      gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
      final passed = await poll();
      expect(types(passed), ['checkChanged', 'ciSummaryChanged']);
      expect(passed.last.from, 'pending');
      expect(passed.last.to, 'passed');
      expect(passed.last.headSha, 'a1');
    });

    test('an unchanged poll stores nothing', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'IN_PROGRESS')];
      await start();
      final before = watch.store.events(id).length;
      expect(await poll(), isEmpty);
      expect(await poll(), isEmpty);
      expect(watch.store.events(id), hasLength(before));
    });

    test('running, then failed', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'IN_PROGRESS')];
      await start();
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'FAILURE')];
      final failed = await poll();
      expect(types(failed), ['checkChanged', 'ciSummaryChanged']);
      expect(failed.last.to, 'failed');
    });

    test('a failed check rerun and passing', () async {
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'FAILURE')];
      await start();
      gh.rollup = [
        FakeGh.checkRun('check', conclusion: 'FAILURE'),
        FakeGh.checkRun(
          'check',
          status: 'IN_PROGRESS',
          startedAt: '2026-10-11T10:30:00Z',
          job: 2,
        ),
      ];
      expect((await poll()).last.to, 'pending');
      gh.rollup.last = FakeGh.checkRun(
        'check',
        conclusion: 'SUCCESS',
        startedAt: '2026-10-11T10:30:00Z',
        job: 2,
      );
      final passed = await poll();
      expect(passed.first.from, 'running');
      expect(passed.first.to, 'passed');
      expect(passed.last.to, 'passed');
    });

    test('checks that register late', () async {
      await start();
      expect(snapshot().ciSummary, CiSummary.none);
      expect(await poll(), isEmpty);

      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      final registered = await poll();
      expect(types(registered), ['checkChanged', 'ciSummaryChanged']);
      expect(registered.first.from, isNull);
      expect(registered.last.from, 'none');
      expect(registered.last.to, 'pending');
    });

    test('a new head voids the old result', () async {
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
      await start();
      expect(snapshot().ciSummary, CiSummary.passed);

      // A push: the new commit has no checks yet.
      gh.head = 'b2';
      gh.rollup = [];
      final pushed = await poll();
      expect(types(pushed), ['headChanged', 'ciSummaryChanged']);
      expect(pushed.first.from, 'a1');
      expect(pushed.first.to, 'b2');
      expect(pushed.first.detail['previousCiSummary'], 'passed');
      expect(pushed.last.to, 'none');
      expect(pushed.last.detail['invalidatedByNewHead'], isTrue);
      expect(snapshot().headSha, 'b2');
      expect(snapshot().ciSummary, CiSummary.none);
    });

    test('an old-head success after a push does not come back', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'IN_PROGRESS')];
      await start();
      gh.head = 'b2';
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await poll();
      // Whatever the old commit's run did next, the snapshot is of b2.
      expect(snapshot().headSha, 'b2');
      expect(snapshot().checks.single.state, CheckState.pending);
      expect(watch.store.events(id).where((e) => e.to == 'passed'), isEmpty);
    });

    test('the same result on a new head is still reported', () async {
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
      await start();
      gh.head = 'b2';
      final again = await poll();
      expect(types(again), ['headChanged', 'checkChanged', 'ciSummaryChanged']);
      expect(again[1].from, isNull, reason: 'not compared with the old commit');
    });

    test('a pull request being merged', () async {
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
      await start();
      gh.prState = 'MERGED';
      final merged = await poll();
      expect(types(merged), ['prStateChanged']);
      expect(merged.single.from, 'OPEN');
      expect(merged.single.to, 'MERGED');
    });

    test('required checks becoming known, and their own result', () async {
      gh.rollup = [
        FakeGh.checkRun('check', status: 'IN_PROGRESS'),
        FakeGh.checkRun('optional', conclusion: 'FAILURE'),
      ];
      await start();
      gh.required = [
        {'name': 'check', 'workflow': 'CI'},
      ];
      final discovered = await poll();
      expect(types(discovered), [
        'requiredDiscoveryChanged',
        'requiredSummaryChanged',
      ]);
      expect(discovered.last.to, 'pending');

      gh.rollup.first = FakeGh.checkRun('check', conclusion: 'SUCCESS');
      final done = await poll();
      expect(done.last.type, 'requiredSummaryChanged');
      expect(done.last.to, 'passed');
      // All checks together still failed: the two are separate.
      expect(snapshot().ciSummary, CiSummary.failed);
    });
  });

  group('durable state', () {
    test('an event is stored before anything is told of it', () async {
      final seenWhenTold = <int, bool>{};
      watch = open(
        notify: (watchId, event) =>
            seenWhenTold[event.id] = WatchStore(dir)
                .events(watchId)
                .any((stored) => stored.id == event.id),
      );
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      expect(seenWhenTold, isNotEmpty);
      expect(seenWhenTold.values, everyElement(isTrue));
    });

    test('a notification that fails loses nothing', () async {
      watch = open(notify: (_, _) => throw StateError('nobody listening'));
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'FAILURE')];
      await poll();
      // The next read, which waits for nothing, has them all.
      expect(types(unread()), contains('ciSummaryChanged'));
      expect(unread().last.to, 'failed');
    });

    test('ids only go up, and reading does not consume', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      final first = unread();
      expect([for (final e in first) e.id], [1, 2, 3, 4]);
      // Asked again without acknowledging: the same events again.
      expect([for (final e in unread()) e.id], [1, 2, 3, 4]);
    });

    test('acknowledged events are not replayed; the rest are', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      watch.acknowledge(id, consumer: chair, through: 4);
      expect(unread(), isEmpty);

      gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
      await poll();
      expect([for (final e in unread()) e.id], [5, 6]);
    });

    test('acknowledging twice, or backwards, changes nothing', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      expect(watch.acknowledge(id, consumer: chair, through: 3)['cursor'], 3);
      expect(watch.acknowledge(id, consumer: chair, through: 3)['cursor'], 3);
      expect(watch.acknowledge(id, consumer: chair, through: 1)['cursor'], 3);
      // Nor past what exists.
      expect(watch.acknowledge(id, consumer: chair, through: 99)['cursor'], 4);
    });

    test('a page is limited and says there is more', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      final page = watch.getEvents(id, consumer: chair, limit: 2);
      expect(page['events'], hasLength(2));
      expect(page['more'], isTrue);
      expect(page['lastEventId'], 4);
    });

    test('restarting keeps what was not dealt with', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      watch.acknowledge(id, consumer: chair, through: 2);
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'FAILURE')];
      await poll();

      // A new process, knowing nothing but the files.
      watch = open();
      expect([for (final e in unread()) e.id], [3, 4, 5, 6]);
      expect(snapshot().ciSummary, CiSummary.failed);
      expect(await poll(), isEmpty, reason: 'nothing changed since');
    });

    test('a crash between storing events and the snapshot adds no '
        'duplicates', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'FAILURE')];

      final crashing = open(store: CrashingStore(dir));
      clock = clock.add(const Duration(minutes: 1));
      await expectLater(crashing.poll(id), throwsStateError);
      // The events are on disk; the snapshot is still the old one.
      expect(watch.store.events(id).last.to, 'failed');
      expect(snapshot().ciSummary, CiSummary.pending);

      final recovered = await poll();
      expect(recovered, isEmpty, reason: 'already stored before the crash');
      expect(snapshot().ciSummary, CiSummary.failed);
      final ids = [for (final e in watch.store.events(id)) e.id];
      expect(ids, [for (var i = 1; i <= ids.length; i++) i]);
    });

    test(
      'a write cut short is not an event, and the next one is whole',
      () async {
        gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
        await start();
        final log = File('${dir.path}/$id/events.jsonl');
        log.writeAsStringSync('{"id":5,"type":"checkCh', mode: FileMode.append);

        expect(watch.store.events(id), hasLength(4));
        gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
        await poll();
        final ids = [for (final e in watch.store.events(id)) e.id];
        expect(ids, [1, 2, 3, 4, 5, 6]);
        expect(log.readAsStringSync(), isNot(contains('"checkCh\n')));
      },
    );

    test('a damaged snapshot file is rebuilt from GitHub', () async {
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
      await start();
      File('${dir.path}/$id/state.json').writeAsStringSync('{"snap');
      expect(watch.store.snapshot(id), isNull);
      await poll();
      expect(snapshot().ciSummary, CiSummary.passed);
    });

    test('state in a format this version does not know is refused', () async {
      await start();
      File('${dir.path}/$id/watch.json')
          .writeAsStringSync('{"schema": 99, "watchId": "$id"}');
      expect(
        () => watch.getSnapshot(id),
        throwsA(
          isA<CiWatchError>().having(
            (e) => e.code,
            'code',
            'incompatibleState',
          ),
        ),
      );
    });

    test('unread events are never pruned, and a gap is reported', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      watch.acknowledge(id, consumer: chair, through: 2);
      expect(watch.prune(id)['prunedThrough'], 2);
      expect([for (final e in watch.store.events(id)) e.id], [3, 4]);

      // The owner lost nothing.
      final own = watch.getEvents(id, consumer: chair);
      expect(own['gap'], isFalse);
      expect(own['events'], hasLength(2));

      // A reader who never saw 1 and 2 is told they are gone.
      final late = watch.getEvents(id, consumer: 'someone-new');
      expect(late['gap'], isTrue);
      expect(late['gapNote'], contains('snapshot'));

      // Ids carry on after a prune, even of everything.
      watch.acknowledge(id, consumer: chair, through: 4);
      watch.prune(id);
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
      expect((await poll()).first.id, 5);
    });

    test('a watch with unread events is not deleted without --force', () async {
      await start();
      expect(
        () => watch.delete(id),
        throwsA(
          isA<CiWatchError>().having((e) => e.code, 'code', 'unreadEvents'),
        ),
      );
      expect(watch.delete(id, force: true)['droppedUnread'], greaterThan(0));
      expect(watch.list(), isEmpty);
    });
  });

  group('one watch, one owner', () {
    test('starting twice gives the same watch', () async {
      await start();
      final again = await watch.start(
        repository: 'octo/app',
        pr: 7,
        owner: 'someone-else',
      );
      expect(again['created'], isFalse);
      expect(again['owner'], chair, reason: 'starting does not take it over');
      expect(watch.list(), hasLength(1));
      expect(
        watch.store.events(id).where((e) => e.type == 'watchStarted'),
        hasLength(1),
      );
    });

    test('only the owner acknowledges', () async {
      await start();
      expect(
        () => watch.acknowledge(id, consumer: 'copilot-chair', through: 1),
        throwsA(isA<CiWatchError>().having((e) => e.code, 'code', 'notOwner')),
      );
      // Anyone may read.
      expect(unread(consumer: 'copilot-chair'), isNotEmpty);
    });

    test('handing over carries on from where the old chair stopped', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'QUEUED')];
      await start();
      watch.acknowledge(id, consumer: chair, through: 3);

      final handed = watch.transferOwnership(id, to: 'copilot-chair');
      expect(handed['previousOwner'], chair);
      expect(handed['cursor'], 3);
      // What the old chair dealt with is not replayed; the rest is.
      expect([for (final e in unread(consumer: 'copilot-chair')) e.id], [4, 5]);
      expect(
        unread(consumer: 'copilot-chair').last.type,
        'ownershipTransferred',
      );
      expect(
        () => watch.acknowledge(id, consumer: chair, through: 5),
        throwsA(isA<CiWatchError>().having((e) => e.code, 'code', 'notOwner')),
      );
      expect(
        watch.acknowledge(id, consumer: 'copilot-chair', through: 5)['cursor'],
        5,
      );
    });

    test(
      'on a machine without the state, it says so and how to go on',
      () async {
        expect(
          () => watch.getEvents(id, consumer: chair),
          throwsA(
            isA<CiWatchError>()
                .having((e) => e.code, 'code', 'noSuchWatch')
                .having((e) => e.action, 'action', contains('mm ci start')),
          ),
        );
        // Starting there rebuilds the snapshot and admits the missing past.
        gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
        await start();
        expect(unread().first.detail['note'], contains('No earlier history'));
        expect(snapshot().ciSummary, CiSummary.passed);
      },
    );

    test(
      'a bad repository or number is refused before anything runs',
      () async {
        await expectLater(
          watch.start(repository: 'octo/app; rm -rf /', pr: 7, owner: chair),
          throwsA(isA<CiWatchError>()),
        );
        await expectLater(
          watch.start(repository: 'octo/app', pr: 0, owner: chair),
          throwsA(isA<CiWatchError>()),
        );
        expect(gh.calls, isEmpty);
      },
    );
  });

  group('when GitHub cannot be read', () {
    test('one error event per streak, then one on recovery', () async {
      await start();
      gh.failure = const GhResult(exitCode: 1, stderr: 'dial tcp: timeout');
      await expectLater(poll(), throwsA(isA<GhFailure>()));
      await expectLater(poll(), throwsA(isA<GhFailure>()));
      final errors = watch.store
          .events(id)
          .where((e) => e.type == 'monitorError');
      expect(errors, hasLength(1));
      expect(errors.single.detail['action'], isNotNull);
      final health = watch.store.health(id);
      expect(health.status, 'failing');
      expect(health.consecutiveFailures, 2);
      // The last good snapshot is kept, with its own time.
      expect(watch.store.snapshot(id), isNotNull);

      gh.failure = null;
      final back = await poll();
      expect(types(back), ['monitorRecovered']);
      expect(watch.store.health(id).consecutiveFailures, 0);
    });
  });

  group('the background loop', () {
    late List<Duration> sleeps;

    WatchLoop loop({
      int maxFailures = 8,
      Duration lifetime = const Duration(hours: 8),
    }) => WatchLoop(
      watch: watch,
      now: () => clock,
      sleep: (time) async {
        sleeps.add(time);
        clock = clock.add(time);
      },
      maxConsecutiveFailures: maxFailures,
      maxLifetime: lifetime,
    );

    setUp(() => sleeps = []);

    test('ends when the pull request is merged', () async {
      gh.rollup = [FakeGh.checkRun('check', conclusion: 'SUCCESS')];
      await start();
      gh.prState = 'MERGED';
      expect(await loop().run(id), 'pullRequestNoLongerOpen');
      final last = watch.store.events(id).last;
      expect(last.type, 'watchStopped');
      expect(watch.store.health(id).status, 'stopped');
      expect(watch.watcherAlive(id), isFalse);
    });

    test('ends when asked to stop, soon', () async {
      await start();
      watch.stop(id);
      expect(await loop().run(id), 'stopRequested');
      expect(sleeps, isEmpty, reason: 'seen before the first poll');
    });

    test('sees a stop request while sleeping between polls', () async {
      await start();
      var slept = 0;
      final stopping = WatchLoop(
        watch: watch,
        now: () => clock,
        sleep: (time) async {
          clock = clock.add(time);
          if (++slept == 2) watch.stop(id);
        },
      );
      expect(await stopping.run(id), 'stopRequested');
      expect(slept, 2, reason: 'not the whole interval');
    });

    test('says it is alive while it runs', () async {
      await start();
      expect(watch.watcherAlive(id), isFalse);
      final running = WatchLoop(
        watch: watch,
        now: () => clock,
        sleep: (time) async {
          expect(watch.watcherAlive(id), isTrue);
          clock = clock.add(time);
          watch.stop(id);
        },
        pid: 4242,
      );
      await running.run(id);
      expect(watch.watcherAlive(id), isFalse);
    });

    test('does not retry a login that was refused', () async {
      await start();
      gh.failure = const GhResult(
        exitCode: 4,
        stderr: 'please run:  gh auth login',
      );
      expect(await loop().run(id), 'authError');
      expect(sleeps, isEmpty);
    });

    test('backs off when it fails, and gives up in the end', () async {
      await start();
      gh.failure = const GhResult(exitCode: 1, stderr: 'dial tcp: timeout');
      final calls = gh.calls.length;
      expect(await loop(maxFailures: 4).run(id), 'tooManyFailures');
      expect(gh.calls.length - calls, 4, reason: 'four attempts and no more');
      final waited = sleeps.fold(Duration.zero, (sum, s) => sum + s);
      // 2, 4 and 8 intervals between the four attempts.
      expect(waited, const Duration(minutes: 14));
    });

    test('waits long when GitHub says to slow down', () async {
      await start();
      gh.failure = const GhResult(
        exitCode: 1,
        stderr: 'HTTP 403: API rate limit exceeded',
      );
      await loop(maxFailures: 2).run(id);
      final waited = sleeps.fold(Duration.zero, (sum, s) => sum + s);
      expect(waited, const Duration(minutes: 10));
    });

    test('does not run forever', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'IN_PROGRESS')];
      await start();
      expect(
        await loop(lifetime: const Duration(minutes: 5)).run(id),
        'lifetimeReached',
      );
    });

    test('a watcher that died is noticed by its silence', () async {
      await start();
      watch.store.saveState(
        id,
        snapshot: snapshot(),
        health: WatchHealth(
          status: 'running',
          heartbeat: clock.toIso8601String(),
          pid: 4242,
        ),
      );
      expect(watch.watcherAlive(id), isTrue);
      clock = clock.add(const Duration(minutes: 4));
      expect(watch.watcherAlive(id), isFalse);
      expect(watch.describe(id)['watcherAlive'], isFalse);
    });
  });

  group('the command', () {
    test('reads return a result at once, not a wait', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'IN_PROGRESS')];
      await start();
      // Synchronous by type: there is nothing to await.
      final Map<String, Object?> events = watch.getEvents(id, consumer: chair);
      final Map<String, Object?> seen = watch.getSnapshot(id);
      expect(events['events'], isNotEmpty);
      expect(seen['ageSeconds'], 0);
      expect(watch.list().single['unreadByOwner'], 4);
    });

    test('starts, lists and stops through mm ci', () async {
      gh.rollup = [FakeGh.checkRun('check', status: 'IN_PROGRESS')];
      Future<int> ci(List<String> args) => runCi(dir, args, gh: gh);
      final stored = Directory('${dir.path}/${WatchStore.relativePath}');

      expect(await ci(['start', '7', '--owner', chair, '--no-watcher']), 0);
      expect(WatchStore(stored).ids(), [id]);
      expect(await ci(['events', id, '--consumer', chair]), 0);
      expect(await ci(['ack', id, '--consumer', chair, '--through', '4']), 0);
      expect(await ci(['ack', id, '--consumer', 'other', '--through', '4']), 1);
      expect(await ci(['poll', id]), 0);
      expect(await ci(['check', '7']), 0);
      expect(await ci(['snapshot', 'no-such-watch']), 1);
      expect(await ci(['start', 'seven', '--owner', chair]), 64);
      expect(await ci(['nonsense']), 64);
      expect(await ci(['stop', id, '--delete']), 0);
      expect(WatchStore(stored).ids(), isEmpty);
    });
  });
}
