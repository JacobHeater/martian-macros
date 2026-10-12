import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { runCi } from '../src/ci/ciCommand.ts';
import { CiWatch } from '../src/ci/ciWatch.ts';
import { CiWatchError } from '../src/ci/ciWatchError.ts';
import { GhFailure } from '../src/ci/ghFailure.ts';
import { normalizeCheckState } from '../src/ci/checkState.ts';
import { GithubReader } from '../src/ci/githubReader.ts';
import type { PrSnapshot } from '../src/ci/prSnapshot.ts';
import type { WatchEvent } from '../src/ci/watchEvent.ts';
import { watchEventFromJson } from '../src/ci/watchEvent.ts';
import { WatchLoop } from '../src/ci/watchLoop.ts';
import { WatchStore } from '../src/ci/watchStore.ts';
import { CrashingStore } from './support/crashingStore.ts';
import { FakeGh } from './support/fakeGh.ts';

/**
 * MM-209: watching pull request checks without waiting for them. GitHub is
 * simulated throughout by `FakeGh`; nothing here touches the network.
 */
let dir = '';
let gh = new FakeGh();
let clock = new Date();
let watch!: CiWatch;
const id = 'octo-app-pr7';
const chair = 'claude-chair';

const open = ({ notify, store }: { notify?: (watchId: string, event: WatchEvent) => void; store?: WatchStore } = {}) =>
  new CiWatch({
    store: store ?? new WatchStore(dir),
    reader: new GithubReader(gh),
    now: () => clock,
    ...(notify === undefined ? {} : { notify }),
  });

/** Lets time pass and reads GitHub once. */
const poll = (using?: CiWatch) => {
  clock = new Date(clock.getTime() + 60_000);
  return (using ?? watch).poll(id);
};

const start = () => watch.start({ repository: 'octo/app', pr: 7, owner: chair });

const types = (events: readonly WatchEvent[]) => events.map((event) => event.type);

const unread = ({ consumer = chair, after }: { consumer?: string; after?: number } = {}): WatchEvent[] =>
  (watch.getEvents(id, { consumer, after })['events'] as Record<string, unknown>[]).map(watchEventFromJson);

const snapshot = (): PrSnapshot => watch.store.snapshot(id)!;

const rejects = async (work: Promise<unknown>, check: (error: unknown) => void) => {
  try {
    await work;
  } catch (error) {
    check(error);
    return;
  }
  assert.fail('expected a failure');
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'mm_ci_watch'));
  gh = new FakeGh();
  clock = new Date(Date.UTC(2026, 9, 11, 10));
  watch = open();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('check states', () => {
  test("GitHub's words are normalized, and unknown ones stay unknown", () => {
    assert.equal(normalizeCheckState('QUEUED', ''), 'pending');
    assert.equal(normalizeCheckState('IN_PROGRESS', ''), 'running');
    assert.equal(normalizeCheckState('WAITING', ''), 'actionRequired');
    assert.equal(normalizeCheckState('COMPLETED', 'SUCCESS'), 'passed');
    assert.equal(normalizeCheckState('COMPLETED', 'FAILURE'), 'failed');
    assert.equal(normalizeCheckState('COMPLETED', 'STARTUP_FAILURE'), 'failed');
    assert.equal(normalizeCheckState('COMPLETED', 'CANCELLED'), 'cancelled');
    assert.equal(normalizeCheckState('COMPLETED', 'SKIPPED'), 'skipped');
    assert.equal(normalizeCheckState('COMPLETED', 'NEUTRAL'), 'neutral');
    assert.equal(normalizeCheckState('COMPLETED', 'TIMED_OUT'), 'timedOut');
    assert.equal(normalizeCheckState('COMPLETED', 'ACTION_REQUIRED'), 'actionRequired');
    assert.equal(normalizeCheckState('COMPLETED', 'STALE'), 'stale');
    assert.equal(normalizeCheckState('COMPLETED', 'SOMETHING_NEW'), 'unknown');
    assert.equal(normalizeCheckState('SOMETHING_NEW', ''), 'unknown');
    assert.equal(normalizeCheckState(undefined, undefined), 'unknown');
    // Commit statuses.
    assert.equal(normalizeCheckState('SUCCESS', undefined), 'passed');
    assert.equal(normalizeCheckState('ERROR', undefined), 'failed');
    assert.equal(normalizeCheckState('EXPECTED', undefined), 'pending');
  });
});

describe('reading GitHub', () => {
  const read = () => new GithubReader(gh).read('octo/app', 7, clock);

  test('no checks is not the same as passed', async () => {
    const seen = await read();
    assert.equal(seen.ciSummary, 'none');
    assert.deepEqual(seen.checks, []);
  });

  test('check runs and commit statuses are both observed', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' }), FakeGh.status('deploy/preview', 'PENDING')];
    const seen = await read();
    assert.deepEqual(
      seen.checks.map((c) => c.key),
      ['CI / check', 'deploy/preview'],
    );
    assert.equal(seen.checks[0]!.kind, 'checkRun');
    assert.match(seen.checks[0]!.url!, /\/actions\/runs\/7\/job\/1/);
    assert.equal(seen.checks[0]!.providerConclusion, 'SUCCESS');
    assert.equal(seen.checks[1]!.kind, 'statusContext');
    assert.equal(seen.checks[1]!.state, 'pending');
    assert.equal(seen.ciSummary, 'pending');
  });

  test('skipped and neutral checks do not make a pass by themselves', async () => {
    gh.rollup = [FakeGh.checkRun('lint', { conclusion: 'SKIPPED' }), FakeGh.checkRun('docs', { conclusion: 'NEUTRAL' })];
    assert.equal((await read()).ciSummary, 'inconclusive');

    gh.rollup.push(FakeGh.checkRun('check', { conclusion: 'SUCCESS' }));
    const seen = await read();
    assert.equal(seen.ciSummary, 'passed');
    assert.deepEqual(seen.counts, { skipped: 1, neutral: 1, passed: 1 });
  });

  test('cancelled, timed out and action required are told apart', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'CANCELLED' })];
    assert.equal((await read()).ciSummary, 'cancelled');
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'ACTION_REQUIRED' })];
    assert.equal((await read()).ciSummary, 'blocked');
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'TIMED_OUT' })];
    assert.equal((await read()).ciSummary, 'failed');
    gh.rollup = [FakeGh.checkRun('check', { status: 'MYSTERY' })];
    assert.equal((await read()).ciSummary, 'unknown');
  });

  test('of several attempts at a check, the last started counts', async () => {
    gh.rollup = [
      FakeGh.checkRun('check', { conclusion: 'FAILURE', job: 1 }),
      FakeGh.checkRun('check', { conclusion: 'SUCCESS', startedAt: '2026-10-11T10:20:00Z', job: 2 }),
    ];
    const seen = await read();
    assert.equal(seen.checks.length, 1);
    assert.equal(seen.checks[0]!.state, 'passed');
    assert.ok(seen.checks[0]!.url!.endsWith('/job/2'));
  });

  test('required checks are marked, and summed up separately', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' }), FakeGh.checkRun('optional', { conclusion: 'FAILURE' })];
    gh.required = [{ name: 'check', workflow: 'CI' }];
    const seen = await read();
    assert.equal(seen.requiredDiscovery, 'discovered');
    assert.deepEqual(
      seen.checks.map((c) => c.required),
      [true, false],
    );
    assert.equal(seen.requiredSummary, 'passed');
    assert.equal(seen.ciSummary, 'failed');
  });

  test('"no required checks reported" is said as that, not as passed', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    const seen = await read();
    assert.equal(seen.requiredDiscovery, 'noneReported');
    assert.equal(seen.requiredSummary, undefined);
  });

  test('when what is required cannot be told, it is unknown', async () => {
    gh.required = { exitCode: 1, stdout: '', stderr: 'HTTP 502: bad gateway' };
    const seen = await read();
    assert.equal(seen.requiredDiscovery, 'unknown');
    assert.equal(seen.requiredSummary, undefined);
  });

  test('a head that moves mid-read is read again, never mixed', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    gh.headsOnRecheck.push('b2');
    const seen = await read();
    assert.equal(seen.headSha, 'b2');
    // The full read was done twice.
    assert.equal(gh.calls.filter((c) => c.at(-1)!.includes('statusCheckRollup')).length, 2);
  });

  test('a head that never settles is an error, not a guess', async () => {
    gh.headsOnRecheck.push('b', 'c', 'd', 'e');
    await rejects(read(), (error) => {
      assert.ok(error instanceof GhFailure);
      assert.equal(error.kind, 'headUnstable');
    });
  });

  test('failures are told apart and say what to do', async () => {
    const failing = async (stderr: string): Promise<GhFailure> => {
      gh.failure = { exitCode: 1, stdout: '', stderr };
      try {
        await read();
      } catch (error) {
        if (error instanceof GhFailure) return error;
      }
      assert.fail('expected a failure');
    };

    const auth = await failing('To get started with GitHub CLI, please run:  gh auth login');
    assert.equal(auth.kind, 'auth');
    assert.match(auth.action, /gh auth/);
    assert.equal((await failing('HTTP 403: API rate limit exceeded')).kind, 'rateLimit');
    assert.equal((await failing('GraphQL: Could not resolve to a PullRequest')).kind, 'notFound');
    assert.equal((await failing('dial tcp: timeout')).kind, 'other');
  });

  test('nothing shaped like a credential is kept from an error', async () => {
    gh.failure = { exitCode: 1, stdout: '', stderr: 'error: token=ghp_abcdefghij1234567890 rejected\nsecond line' };
    await rejects(read(), (error) => {
      assert.ok(error instanceof GhFailure);
      assert.ok(!error.message.includes('ghp_'));
      assert.ok(!error.message.includes('second line'));
    });
  });

  test('arguments go to gh as a list, with the repository named', async () => {
    await read();
    for (const call of gh.calls) {
      const at = call.indexOf('--repo');
      assert.ok(at !== -1 && call[at + 1] === 'octo/app');
    }
    assert.ok(gh.calls.some((c) => c.includes('--required')));
  });
});

describe('events', () => {
  test('pending, then running, then passed', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    assert.deepEqual(types(unread()), ['watchStarted', 'checkChanged', 'ciSummaryChanged', 'requiredDiscoveryChanged']);

    gh.rollup = [FakeGh.checkRun('check', { status: 'IN_PROGRESS' })];
    const running = await poll();
    // Running is still pending overall: one change, not two.
    assert.deepEqual(types(running), ['checkChanged']);
    assert.equal(running[0]!.from, 'pending');
    assert.equal(running[0]!.to, 'running');
    assert.match(running[0]!.detail['url'] as string, /\/job\/1/);

    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    const passed = await poll();
    assert.deepEqual(types(passed), ['checkChanged', 'ciSummaryChanged']);
    assert.equal(passed.at(-1)!.from, 'pending');
    assert.equal(passed.at(-1)!.to, 'passed');
    assert.equal(passed.at(-1)!.headSha, 'a1');
  });

  test('an unchanged poll stores nothing', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'IN_PROGRESS' })];
    await start();
    const before = watch.store.events(id).length;
    assert.deepEqual(await poll(), []);
    assert.deepEqual(await poll(), []);
    assert.equal(watch.store.events(id).length, before);
  });

  test('running, then failed', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'IN_PROGRESS' })];
    await start();
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'FAILURE' })];
    const failed = await poll();
    assert.deepEqual(types(failed), ['checkChanged', 'ciSummaryChanged']);
    assert.equal(failed.at(-1)!.to, 'failed');
  });

  test('a failed check rerun and passing', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'FAILURE' })];
    await start();
    gh.rollup = [
      FakeGh.checkRun('check', { conclusion: 'FAILURE' }),
      FakeGh.checkRun('check', { status: 'IN_PROGRESS', startedAt: '2026-10-11T10:30:00Z', job: 2 }),
    ];
    assert.equal((await poll()).at(-1)!.to, 'pending');
    gh.rollup[1] = FakeGh.checkRun('check', { conclusion: 'SUCCESS', startedAt: '2026-10-11T10:30:00Z', job: 2 });
    const passed = await poll();
    assert.equal(passed[0]!.from, 'running');
    assert.equal(passed[0]!.to, 'passed');
    assert.equal(passed.at(-1)!.to, 'passed');
  });

  test('checks that register late', async () => {
    await start();
    assert.equal(snapshot().ciSummary, 'none');
    assert.deepEqual(await poll(), []);

    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    const registered = await poll();
    assert.deepEqual(types(registered), ['checkChanged', 'ciSummaryChanged']);
    assert.equal(registered[0]!.from, undefined);
    assert.equal(registered.at(-1)!.from, 'none');
    assert.equal(registered.at(-1)!.to, 'pending');
  });

  test('a new head voids the old result', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    await start();
    assert.equal(snapshot().ciSummary, 'passed');

    // A push: the new commit has no checks yet.
    gh.head = 'b2';
    gh.rollup = [];
    const pushed = await poll();
    assert.deepEqual(types(pushed), ['headChanged', 'ciSummaryChanged']);
    assert.equal(pushed[0]!.from, 'a1');
    assert.equal(pushed[0]!.to, 'b2');
    assert.equal(pushed[0]!.detail['previousCiSummary'], 'passed');
    assert.equal(pushed.at(-1)!.to, 'none');
    assert.equal(pushed.at(-1)!.detail['invalidatedByNewHead'], true);
    assert.equal(snapshot().headSha, 'b2');
    assert.equal(snapshot().ciSummary, 'none');
  });

  test('an old-head success after a push does not come back', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'IN_PROGRESS' })];
    await start();
    gh.head = 'b2';
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await poll();
    // Whatever the old commit's run did next, the snapshot is of b2.
    assert.equal(snapshot().headSha, 'b2');
    assert.equal(snapshot().checks[0]!.state, 'pending');
    assert.deepEqual(
      watch.store.events(id).filter((e) => e.to === 'passed'),
      [],
    );
  });

  test('the same result on a new head is still reported', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    await start();
    gh.head = 'b2';
    const again = await poll();
    assert.deepEqual(types(again), ['headChanged', 'checkChanged', 'ciSummaryChanged']);
    assert.equal(again[1]!.from, undefined, 'not compared with the old commit');
  });

  test('a pull request being merged', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    await start();
    gh.prState = 'MERGED';
    const merged = await poll();
    assert.deepEqual(types(merged), ['prStateChanged']);
    assert.equal(merged[0]!.from, 'OPEN');
    assert.equal(merged[0]!.to, 'MERGED');
  });

  test('required checks becoming known, and their own result', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'IN_PROGRESS' }), FakeGh.checkRun('optional', { conclusion: 'FAILURE' })];
    await start();
    gh.required = [{ name: 'check', workflow: 'CI' }];
    const discovered = await poll();
    assert.deepEqual(types(discovered), ['requiredDiscoveryChanged', 'requiredSummaryChanged']);
    assert.equal(discovered.at(-1)!.to, 'pending');

    gh.rollup[0] = FakeGh.checkRun('check', { conclusion: 'SUCCESS' });
    const done = await poll();
    assert.equal(done.at(-1)!.type, 'requiredSummaryChanged');
    assert.equal(done.at(-1)!.to, 'passed');
    // All checks together still failed: the two are separate.
    assert.equal(snapshot().ciSummary, 'failed');
  });
});

describe('durable state', () => {
  test('an event is stored before anything is told of it', async () => {
    const seenWhenTold = new Map<number, boolean>();
    watch = open({
      notify: (watchId, event) =>
        seenWhenTold.set(
          event.id,
          new WatchStore(dir).events(watchId).some((stored) => stored.id === event.id),
        ),
    });
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    assert.ok(seenWhenTold.size > 0);
    assert.ok([...seenWhenTold.values()].every((seen) => seen));
  });

  test('a notification that fails loses nothing', async () => {
    watch = open({
      notify: () => {
        throw new Error('nobody listening');
      },
    });
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'FAILURE' })];
    await poll();
    // The next read, which waits for nothing, has them all.
    assert.ok(types(unread()).includes('ciSummaryChanged'));
    assert.equal(unread().at(-1)!.to, 'failed');
  });

  test('ids only go up, and reading does not consume', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    assert.deepEqual(
      unread().map((e) => e.id),
      [1, 2, 3, 4],
    );
    // Asked again without acknowledging: the same events again.
    assert.deepEqual(
      unread().map((e) => e.id),
      [1, 2, 3, 4],
    );
  });

  test('acknowledged events are not replayed; the rest are', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    watch.acknowledge(id, { consumer: chair, through: 4 });
    assert.deepEqual(unread(), []);

    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    await poll();
    assert.deepEqual(
      unread().map((e) => e.id),
      [5, 6],
    );
  });

  test('acknowledging twice, or backwards, changes nothing', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    assert.equal(watch.acknowledge(id, { consumer: chair, through: 3 })['cursor'], 3);
    assert.equal(watch.acknowledge(id, { consumer: chair, through: 3 })['cursor'], 3);
    assert.equal(watch.acknowledge(id, { consumer: chair, through: 1 })['cursor'], 3);
    // Nor past what exists.
    assert.equal(watch.acknowledge(id, { consumer: chair, through: 99 })['cursor'], 4);
  });

  test('a page is limited and says there is more', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    const page = watch.getEvents(id, { consumer: chair, limit: 2 });
    assert.equal((page['events'] as unknown[]).length, 2);
    assert.equal(page['more'], true);
    assert.equal(page['lastEventId'], 4);
  });

  test('restarting keeps what was not dealt with', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    watch.acknowledge(id, { consumer: chair, through: 2 });
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'FAILURE' })];
    await poll();

    // A new process, knowing nothing but the files.
    watch = open();
    assert.deepEqual(
      unread().map((e) => e.id),
      [3, 4, 5, 6],
    );
    assert.equal(snapshot().ciSummary, 'failed');
    assert.deepEqual(await poll(), [], 'nothing changed since');
  });

  test('a crash between storing events and the snapshot adds no duplicates', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'FAILURE' })];

    const crashing = open({ store: new CrashingStore(dir) });
    clock = new Date(clock.getTime() + 60_000);
    await rejects(crashing.poll(id), (error) => assert.match((error as Error).message, /died here/));
    // The events are on disk; the snapshot is still the old one.
    assert.equal(watch.store.events(id).at(-1)!.to, 'failed');
    assert.equal(snapshot().ciSummary, 'pending');

    const recovered = await poll();
    assert.deepEqual(recovered, [], 'already stored before the crash');
    assert.equal(snapshot().ciSummary, 'failed');
    const ids = watch.store.events(id).map((e) => e.id);
    assert.deepEqual(
      ids,
      Array.from({ length: ids.length }, (_, i) => i + 1),
    );
  });

  test('a write cut short is not an event, and the next one is whole', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    const log = `${dir}/${id}/events.jsonl`;
    appendFileSync(log, '{"id":5,"type":"checkCh');

    assert.equal(watch.store.events(id).length, 4);
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    await poll();
    assert.deepEqual(
      watch.store.events(id).map((e) => e.id),
      [1, 2, 3, 4, 5, 6],
    );
    assert.ok(!readFileSync(log, 'utf8').includes('"checkCh\n'));
  });

  test('a damaged snapshot file is rebuilt from GitHub', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    await start();
    writeFileSync(`${dir}/${id}/state.json`, '{"snap');
    assert.equal(watch.store.snapshot(id), undefined);
    await poll();
    assert.equal(snapshot().ciSummary, 'passed');
  });

  test('state in a format this version does not know is refused', async () => {
    await start();
    writeFileSync(`${dir}/${id}/watch.json`, `{"schema": 99, "watchId": "${id}"}`);
    assert.throws(
      () => watch.getSnapshot(id),
      (error: unknown) => error instanceof CiWatchError && error.code === 'incompatibleState',
    );
  });

  test('unread events are never pruned, and a gap is reported', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    watch.acknowledge(id, { consumer: chair, through: 2 });
    assert.equal(watch.prune(id)['prunedThrough'], 2);
    assert.deepEqual(
      watch.store.events(id).map((e) => e.id),
      [3, 4],
    );

    // The owner lost nothing.
    const own = watch.getEvents(id, { consumer: chair });
    assert.equal(own['gap'], false);
    assert.equal((own['events'] as unknown[]).length, 2);

    // A reader who never saw 1 and 2 is told they are gone.
    const late = watch.getEvents(id, { consumer: 'someone-new' });
    assert.equal(late['gap'], true);
    assert.match(late['gapNote'] as string, /snapshot/);

    // Ids carry on after a prune, even of everything.
    watch.acknowledge(id, { consumer: chair, through: 4 });
    watch.prune(id);
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    assert.equal((await poll())[0]!.id, 5);
  });

  test('a watch with unread events is not deleted without --force', async () => {
    await start();
    assert.throws(
      () => watch.delete(id),
      (error: unknown) => error instanceof CiWatchError && error.code === 'unreadEvents',
    );
    assert.ok((watch.delete(id, { force: true })['droppedUnread'] as number) > 0);
    assert.deepEqual(watch.list(), []);
  });
});

describe('one watch, one owner', () => {
  test('starting twice gives the same watch', async () => {
    await start();
    const again = await watch.start({ repository: 'octo/app', pr: 7, owner: 'someone-else' });
    assert.equal(again['created'], false);
    assert.equal(again['owner'], chair, 'starting does not take it over');
    assert.equal(watch.list().length, 1);
    assert.equal(watch.store.events(id).filter((e) => e.type === 'watchStarted').length, 1);
  });

  test('only the owner acknowledges', async () => {
    await start();
    assert.throws(
      () => watch.acknowledge(id, { consumer: 'copilot-chair', through: 1 }),
      (error: unknown) => error instanceof CiWatchError && error.code === 'notOwner',
    );
    // Anyone may read.
    assert.ok(unread({ consumer: 'copilot-chair' }).length > 0);
  });

  test('handing over carries on from where the old chair stopped', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'QUEUED' })];
    await start();
    watch.acknowledge(id, { consumer: chair, through: 3 });

    const handed = watch.transferOwnership(id, { to: 'copilot-chair' });
    assert.equal(handed['previousOwner'], chair);
    assert.equal(handed['cursor'], 3);
    // What the old chair dealt with is not replayed; the rest is.
    assert.deepEqual(
      unread({ consumer: 'copilot-chair' }).map((e) => e.id),
      [4, 5],
    );
    assert.equal(unread({ consumer: 'copilot-chair' }).at(-1)!.type, 'ownershipTransferred');
    assert.throws(
      () => watch.acknowledge(id, { consumer: chair, through: 5 }),
      (error: unknown) => error instanceof CiWatchError && error.code === 'notOwner',
    );
    assert.equal(watch.acknowledge(id, { consumer: 'copilot-chair', through: 5 })['cursor'], 5);
  });

  test('on a machine without the state, it says so and how to go on', async () => {
    assert.throws(
      () => watch.getEvents(id, { consumer: chair }),
      (error: unknown) => error instanceof CiWatchError && error.code === 'noSuchWatch' && error.action!.includes('mm ci start'),
    );
    // Starting there rebuilds the snapshot and admits the missing past.
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    await start();
    assert.match(unread()[0]!.detail['note'] as string, /No earlier history/);
    assert.equal(snapshot().ciSummary, 'passed');
  });

  test('a bad repository or number is refused before anything runs', async () => {
    await rejects(watch.start({ repository: 'octo/app; rm -rf /', pr: 7, owner: chair }), (error) =>
      assert.ok(error instanceof CiWatchError),
    );
    await rejects(watch.start({ repository: 'octo/app', pr: 0, owner: chair }), (error) => assert.ok(error instanceof CiWatchError));
    assert.deepEqual(gh.calls, []);
  });
});

describe('when GitHub cannot be read', () => {
  test('one error event per streak, then one on recovery', async () => {
    await start();
    gh.failure = { exitCode: 1, stdout: '', stderr: 'dial tcp: timeout' };
    await rejects(poll(), (error) => assert.ok(error instanceof GhFailure));
    await rejects(poll(), (error) => assert.ok(error instanceof GhFailure));
    const errors = watch.store.events(id).filter((e) => e.type === 'monitorError');
    assert.equal(errors.length, 1);
    assert.notEqual(errors[0]!.detail['action'], undefined);
    const health = watch.store.health(id);
    assert.equal(health.status, 'failing');
    assert.equal(health.consecutiveFailures, 2);
    // The last good snapshot is kept, with its own time.
    assert.notEqual(watch.store.snapshot(id), undefined);

    gh.failure = undefined;
    const back = await poll();
    assert.deepEqual(types(back), ['monitorRecovered']);
    assert.equal(watch.store.health(id).consecutiveFailures, 0);
  });
});

describe('the background loop', () => {
  let sleeps: number[] = [];

  const loop = ({ maxFailures = 8, lifetimeMs = 8 * 3600_000 }: { maxFailures?: number; lifetimeMs?: number } = {}) =>
    new WatchLoop({
      watch,
      now: () => clock,
      sleep: async (ms) => {
        sleeps.push(ms);
        clock = new Date(clock.getTime() + ms);
      },
      maxConsecutiveFailures: maxFailures,
      maxLifetimeMs: lifetimeMs,
    });

  beforeEach(() => {
    sleeps = [];
  });

  test('ends when the pull request is merged', async () => {
    gh.rollup = [FakeGh.checkRun('check', { conclusion: 'SUCCESS' })];
    await start();
    gh.prState = 'MERGED';
    assert.equal(await loop().run(id), 'pullRequestNoLongerOpen');
    assert.equal(watch.store.events(id).at(-1)!.type, 'watchStopped');
    assert.equal(watch.store.health(id).status, 'stopped');
    assert.equal(watch.watcherAlive(id), false);
  });

  test('ends when asked to stop, soon', async () => {
    await start();
    watch.stop(id);
    assert.equal(await loop().run(id), 'stopRequested');
    assert.deepEqual(sleeps, [], 'seen before the first poll');
  });

  test('sees a stop request while sleeping between polls', async () => {
    await start();
    let slept = 0;
    const stopping = new WatchLoop({
      watch,
      now: () => clock,
      sleep: async (ms) => {
        clock = new Date(clock.getTime() + ms);
        if (++slept === 2) watch.stop(id);
      },
    });
    assert.equal(await stopping.run(id), 'stopRequested');
    assert.equal(slept, 2, 'not the whole interval');
  });

  test('says it is alive while it runs', async () => {
    await start();
    assert.equal(watch.watcherAlive(id), false);
    const running = new WatchLoop({
      watch,
      now: () => clock,
      sleep: async (ms) => {
        assert.equal(watch.watcherAlive(id), true);
        clock = new Date(clock.getTime() + ms);
        watch.stop(id);
      },
      pid: 4242,
    });
    await running.run(id);
    assert.equal(watch.watcherAlive(id), false);
  });

  test('does not retry a login that was refused', async () => {
    await start();
    gh.failure = { exitCode: 4, stdout: '', stderr: 'please run:  gh auth login' };
    assert.equal(await loop().run(id), 'authError');
    assert.deepEqual(sleeps, []);
  });

  test('backs off when it fails, and gives up in the end', async () => {
    await start();
    gh.failure = { exitCode: 1, stdout: '', stderr: 'dial tcp: timeout' };
    const calls = gh.calls.length;
    assert.equal(await loop({ maxFailures: 4 }).run(id), 'tooManyFailures');
    assert.equal(gh.calls.length - calls, 4, 'four attempts and no more');
    const waited = sleeps.reduce((sum, ms) => sum + ms, 0);
    // 2, 4 and 8 intervals between the four attempts.
    assert.equal(waited, 14 * 60_000);
  });

  test('waits long when GitHub says to slow down', async () => {
    await start();
    gh.failure = { exitCode: 1, stdout: '', stderr: 'HTTP 403: API rate limit exceeded' };
    await loop({ maxFailures: 2 }).run(id);
    const waited = sleeps.reduce((sum, ms) => sum + ms, 0);
    assert.equal(waited, 10 * 60_000);
  });

  test('does not run forever', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'IN_PROGRESS' })];
    await start();
    assert.equal(await loop({ lifetimeMs: 5 * 60_000 }).run(id), 'lifetimeReached');
  });

  test('a watcher that died is noticed by its silence', async () => {
    await start();
    watch.store.saveState(id, {
      snapshot: snapshot(),
      health: { status: 'running', consecutiveFailures: 0, heartbeat: clock.toISOString(), pid: 4242 },
    });
    assert.equal(watch.watcherAlive(id), true);
    clock = new Date(clock.getTime() + 4 * 60_000);
    assert.equal(watch.watcherAlive(id), false);
    assert.equal(watch.describe(id)['watcherAlive'], false);
  });
});

describe('the command', () => {
  test('reads return a result at once, not a wait', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'IN_PROGRESS' })];
    await start();
    // Synchronous by type: there is nothing to await.
    const events = watch.getEvents(id, { consumer: chair });
    const seen = watch.getSnapshot(id);
    assert.ok((events['events'] as unknown[]).length > 0);
    assert.equal(seen['ageSeconds'], 0);
    assert.equal(watch.list()[0]!['unreadByOwner'], 4);
  });

  test('starts, lists and stops through mm ci', async () => {
    gh.rollup = [FakeGh.checkRun('check', { status: 'IN_PROGRESS' })];
    const ci = (args: string[]) => runCi(dir, args, gh);
    const stored = `${dir}/${WatchStore.relativePath}`;

    assert.equal(await ci(['start', '7', '--owner', chair, '--no-watcher']), 0);
    assert.deepEqual(new WatchStore(stored).ids(), [id]);
    assert.equal(await ci(['events', id, '--consumer', chair]), 0);
    assert.equal(await ci(['ack', id, '--consumer', chair, '--through', '4']), 0);
    assert.equal(await ci(['ack', id, '--consumer', 'other', '--through', '4']), 1);
    assert.equal(await ci(['poll', id]), 0);
    assert.equal(await ci(['check', '7']), 0);
    assert.equal(await ci(['snapshot', 'no-such-watch']), 1);
    assert.equal(await ci(['start', 'seven', '--owner', chair]), 64);
    assert.equal(await ci(['nonsense']), 64);
    assert.equal(await ci(['stop', id, '--delete']), 0);
    assert.deepEqual(new WatchStore(stored).ids(), []);
  });
});
