import { CiWatchError } from './ciWatchError.ts';
import { diffSnapshots } from './diffSnapshots.ts';
import { GhFailure } from './ghFailure.ts';
import type { GithubReader } from './githubReader.ts';
import type { PrSnapshot } from './prSnapshot.ts';
import type { WatchEvent } from './watchEvent.ts';
import { watchEventToJson } from './watchEvent.ts';
import { watchId } from './watchId.ts';
import { watchHealthToJson } from './watchHealth.ts';
import type { WatchStore } from './watchStore.ts';

/**
 * Watches pull requests' checks and keeps what it sees (MM-209).
 *
 * It only reads GitHub. Stored events are the truth; `notify` is a hint
 * sent after an event is on disk, and its failing loses nothing. Every
 * read here returns at once; nothing waits for CI.
 */
export class CiWatch {
  readonly store: WatchStore;
  readonly reader: GithubReader;
  private readonly now: () => Date;

  /** Told about each new event after it is stored. */
  private readonly notify: ((watchId: string, event: WatchEvent) => void) | undefined;

  /**
   * A heartbeat older than this many poll intervals means the background
   * watcher is gone.
   */
  static readonly staleAfterIntervals = 3;

  constructor(init: {
    store: WatchStore;
    reader: GithubReader;
    now?: () => Date;
    notify?: (watchId: string, event: WatchEvent) => void;
  }) {
    this.store = init.store;
    this.reader = init.reader;
    this.now = init.now ?? (() => new Date());
    this.notify = init.notify;
  }

  private stamp(): string {
    return this.now().toISOString();
  }

  /**
   * Starts watching a pull request, or returns the watch already there:
   * one pull request has one watch. The first snapshot is taken now.
   *
   * `owner` is the reader who acts on its events (the chair). A watch that
   * has no stored history, on a new machine say, starts from what GitHub
   * shows now and says so in its first event.
   */
  async start(init: { repository: string; pr: number; owner: string; intervalSeconds?: number }): Promise<Record<string, unknown>> {
    const { repository, pr, owner, intervalSeconds = 60 } = init;
    if (pr <= 0 || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
      throw new CiWatchError('badRequest', 'Give a repository as owner/name and a pull request number.');
    }
    const id = watchId(repository, pr);
    const existed = this.store.exists(id);
    if (existed) {
      this.store.watch(id);
    } else {
      this.store.create(id, { repository, pr, intervalSeconds, createdAt: this.stamp() });
      this.store.saveConsumer(id, { ...this.store.consumer(id), owner, stopRequested: false });
      this.store.append(id, [
        {
          id: 0,
          type: 'watchStarted',
          at: this.stamp(),
          detail: {
            owner,
            note: 'No earlier history is stored here. What happened before this is not known to the watch; the snapshot is.',
          },
        },
      ]);
    }
    // A stop asked for earlier no longer holds once it is started again.
    const consumer = this.store.consumer(id);
    if (consumer['stopRequested'] === true) {
      this.store.saveConsumer(id, { ...consumer, stopRequested: false });
    }
    if (!this.watcherAlive(id)) await this.poll(id);
    return { watchId: id, created: !existed, ...this.describe(id) };
  }

  /**
   * Reads GitHub once and stores what changed. Returns the new events.
   * A failure to read is recorded in the watch's health and thrown.
   */
  async poll(id: string, { pid, heartbeat = false }: { pid?: number; heartbeat?: boolean } = {}): Promise<WatchEvent[]> {
    const watch = this.watchOf(id);
    const before = this.store.snapshot(id);
    const health = this.store.health(id);
    const stamp = this.stamp();
    let after: PrSnapshot;
    try {
      after = await this.reader.read(watch['repository'] as string, watch['pr'] as number, this.now());
    } catch (error) {
      if (!(error instanceof GhFailure)) throw error;
      const first = health.consecutiveFailures === 0;
      const stored = first
        ? this.store.append(id, [
            {
              id: 0,
              type: 'monitorError',
              at: stamp,
              headSha: before?.headSha,
              to: error.kind,
              detail: { message: error.message, action: error.action },
            },
          ])
        : [];
      this.store.saveState(id, {
        snapshot: before,
        health: {
          ...health,
          status: 'failing',
          lastAttempt: stamp,
          consecutiveFailures: health.consecutiveFailures + 1,
          lastError: error.message,
          lastErrorKind: error.kind,
          ...(heartbeat ? { heartbeat: stamp } : {}),
          ...(pid === undefined ? {} : { pid }),
        },
      });
      this.tell(id, stored);
      throw error;
    }
    const drafts: WatchEvent[] = [
      ...(health.consecutiveFailures > 0
        ? [{ id: 0, type: 'monitorRecovered', at: after.observedAt, headSha: after.headSha, from: health.lastErrorKind, detail: {} }]
        : []),
      ...diffSnapshots(before, after),
    ];
    // Events first: a crash after this line loses nothing, and the same
    // poll done again adds nothing twice.
    const stored = this.store.append(id, drafts);
    this.store.saveState(id, {
      snapshot: after,
      health: {
        ...health,
        status: heartbeat ? 'running' : health.status,
        lastSuccessfulPoll: after.observedAt,
        lastAttempt: after.observedAt,
        consecutiveFailures: 0,
        lastError: undefined,
        lastErrorKind: undefined,
        ...(heartbeat ? { heartbeat: after.observedAt } : {}),
        ...(pid === undefined ? {} : { pid }),
      },
    });
    this.tell(id, stored);
    return stored;
  }

  private tell(id: string, events: readonly WatchEvent[]): void {
    if (this.notify === undefined) return;
    for (const event of events) {
      try {
        this.notify(id, event);
      } catch {
        // A hint that did not arrive. The event is stored; the next read
        // finds it.
      }
    }
  }

  list(): Record<string, unknown>[] {
    return this.store.ids().map((id) => {
      try {
        return { watchId: id, ...this.describe(id) };
      } catch (error) {
        return { watchId: id, incompatible: error instanceof Error ? error.message : `${error}` };
      }
    });
  }

  /**
   * A watch in brief: what it watches, who owns it, how it is doing and how
   * much each reader has left to read.
   */
  describe(id: string): Record<string, unknown> {
    const watch = this.watchOf(id);
    const consumer = this.store.consumer(id);
    const events = this.store.events(id);
    const snapshot = this.store.snapshot(id);
    const cursors = (consumer['cursors'] as Record<string, unknown> | undefined) ?? {};
    const owner = consumer['owner'] as string | null;
    const ownerCursor = (owner !== null ? (cursors[owner] as number | undefined) : undefined) ?? 0;
    return {
      repository: watch['repository'],
      pr: watch['pr'],
      intervalSeconds: watch['intervalSeconds'],
      owner,
      headSha: snapshot?.headSha ?? null,
      prState: snapshot?.prState ?? null,
      ciSummary: snapshot?.ciSummary ?? null,
      lastEventId: events.at(-1)?.id ?? 0,
      ownerCursor,
      unreadByOwner: events.filter((event) => event.id > ownerCursor).length,
      cursors,
      stopRequested: consumer['stopRequested'] === true,
      watcherAlive: this.watcherAlive(id),
      health: watchHealthToJson(this.store.health(id)),
    };
  }

  /**
   * The latest stored snapshot and how old it is. A snapshot is what was
   * seen then; before merging, GitHub is read again.
   */
  getSnapshot(id: string): Record<string, unknown> {
    this.watchOf(id);
    const snapshot = this.store.snapshot(id);
    return {
      watchId: id,
      snapshot: snapshot?.toJson() ?? null,
      ageSeconds:
        snapshot === undefined ? null : Math.floor((this.now().getTime() - new Date(snapshot.observedAt).getTime()) / 1000),
      watcherAlive: this.watcherAlive(id),
      health: watchHealthToJson(this.store.health(id)),
    };
  }

  /**
   * The events after a cursor, oldest first, at once. With no `after` it
   * continues from what `consumer` last acknowledged, so asking twice
   * without acknowledging gives the same events twice.
   *
   * `gap` is true when events the reader has not seen are no longer
   * stored; the reader must then go by the snapshot.
   */
  getEvents(id: string, init: { consumer: string; after?: number | undefined; limit?: number }): Record<string, unknown> {
    this.watchOf(id);
    const { consumer, after, limit = 100 } = init;
    const state = this.store.consumer(id);
    const cursors = (state['cursors'] as Record<string, unknown> | undefined) ?? {};
    const from = after ?? (cursors[consumer] as number | undefined) ?? 0;
    const all = this.store.events(id);
    const pruned = (state['prunedThrough'] as number | undefined) ?? 0;
    const unread = all.filter((event) => event.id > from);
    const page = unread.slice(0, limit < 1 ? 1 : limit);
    return {
      watchId: id,
      consumer,
      owner: state['owner'],
      after: from,
      gap: from < pruned,
      ...(from < pruned
        ? { gapNote: `Events ${from + 1} to ${pruned} are no longer stored. Go by the snapshot, then acknowledge through ${pruned}.` }
        : {}),
      events: page.map(watchEventToJson),
      more: unread.length > page.length,
      lastEventId: all.at(-1)?.id ?? pruned,
    };
  }

  /**
   * Records that `consumer` has dealt with every event up to `through`:
   * processed, not merely received. Acknowledging the same events again
   * changes nothing. Only the owner may, so two chairs cannot both act.
   */
  acknowledge(id: string, init: { consumer: string; through: number }): Record<string, unknown> {
    this.watchOf(id);
    const { consumer, through } = init;
    const state = this.store.consumer(id);
    if (state['owner'] !== consumer) {
      throw new CiWatchError(
        'notOwner',
        `"${consumer}" does not own this watch; "${state['owner']}" does.`,
        'Read without acknowledging, or take the watch over with "mm ci own" once the other chair has stopped.',
      );
    }
    const last = this.store.events(id).at(-1)?.id ?? 0;
    const cursors = { ...((state['cursors'] as Record<string, unknown> | undefined) ?? {}) };
    const was = (cursors[consumer] as number | undefined) ?? 0;
    // Never backwards, never past what exists.
    const now = Math.min(Math.max(through, was), Math.max(last, was));
    cursors[consumer] = now;
    this.store.saveConsumer(id, { ...state, cursors });
    return { watchId: id, consumer, cursor: now, was };
  }

  /**
   * Hands the watch to another chair. The new owner starts from where the
   * old one had acknowledged, so nothing dealt with is replayed as new and
   * nothing undealt with is skipped.
   */
  transferOwnership(id: string, { to }: { to: string }): Record<string, unknown> {
    this.watchOf(id);
    const state = this.store.consumer(id);
    const from = (state['owner'] as string | null) ?? undefined;
    if (from === to) return { watchId: id, owner: to, changed: false };
    const cursors = { ...((state['cursors'] as Record<string, unknown> | undefined) ?? {}) };
    const inherited = (from !== undefined ? (cursors[from] as number | undefined) : undefined) ?? 0;
    const own = (cursors[to] as number | undefined) ?? 0;
    cursors[to] = Math.max(inherited, own);
    this.store.saveConsumer(id, { ...state, owner: to, cursors });
    const stored = this.store.append(id, [
      {
        id: 0,
        type: 'ownershipTransferred',
        at: this.stamp(),
        headSha: this.store.snapshot(id)?.headSha,
        from,
        to,
        detail: { cursor: cursors[to] },
      },
    ]);
    this.tell(id, stored);
    return { watchId: id, owner: to, changed: true, previousOwner: from ?? null, cursor: cursors[to] };
  }

  /**
   * Asks the watch to stop. A background watcher sees the request at its
   * next turn and exits; this returns at once. Events and the snapshot are
   * kept until `delete`.
   */
  stop(id: string): Record<string, unknown> {
    this.watchOf(id);
    this.store.saveConsumer(id, { ...this.store.consumer(id), stopRequested: true });
    return { watchId: id, stopRequested: true, watcherAlive: this.watcherAlive(id) };
  }

  /**
   * Removes a stopped watch and its events. Refused while a watcher runs,
   * and while the owner has events it has not acknowledged unless `force`.
   */
  delete(id: string, { force = false }: { force?: boolean } = {}): Record<string, unknown> {
    this.watchOf(id);
    if (this.watcherAlive(id)) {
      throw new CiWatchError('watcherRunning', 'The background watcher is still running.', 'Run "mm ci stop" and try again in a moment.');
    }
    const unread = this.describe(id)['unreadByOwner'] as number;
    if (unread > 0 && !force) {
      throw new CiWatchError(
        'unreadEvents',
        `${unread} event(s) have not been acknowledged by the owner.`,
        'Read and acknowledge them, or pass --force to drop them.',
      );
    }
    this.store.delete(id);
    return { watchId: id, deleted: true, droppedUnread: unread };
  }

  /**
   * Forgets events the owner has acknowledged. Refused while a watcher
   * runs. Unacknowledged events are never dropped.
   */
  prune(id: string): Record<string, unknown> {
    this.watchOf(id);
    if (this.watcherAlive(id)) {
      throw new CiWatchError('watcherRunning', 'The background watcher is still running.', 'Run "mm ci stop" and try again in a moment.');
    }
    const through = this.describe(id)['ownerCursor'] as number;
    this.store.prune(id, through);
    return { watchId: id, prunedThrough: through };
  }

  /** Whether a background watcher said it was alive recently enough. */
  watcherAlive(id: string): boolean {
    const health = this.store.health(id);
    const beat = health.heartbeat;
    if (beat === undefined || health.status === 'stopped') return false;
    const interval = (this.store.watch(id)['intervalSeconds'] as number | undefined) ?? 60;
    return (this.now().getTime() - new Date(beat).getTime()) / 1000 <= interval * CiWatch.staleAfterIntervals;
  }

  /** Marks the watch as no longer being polled, with why. */
  markStopped(id: string, reason: string): void {
    const stored = this.store.append(id, [
      { id: 0, type: 'watchStopped', at: this.stamp(), headSha: this.store.snapshot(id)?.headSha, to: reason, detail: {} },
    ]);
    this.store.saveState(id, {
      snapshot: this.store.snapshot(id),
      health: { ...this.store.health(id), status: 'stopped', pid: undefined },
    });
    this.tell(id, stored);
  }

  stopRequested(id: string): boolean {
    return this.store.consumer(id)['stopRequested'] === true;
  }

  private watchOf(id: string): Record<string, unknown> {
    if (!this.store.exists(id)) {
      throw new CiWatchError(
        'noSuchWatch',
        `There is no watch "${id}" on this machine.`,
        'List them with "mm ci list". Local watch state does not travel through git: on another machine, start it again with "mm ci start <pr>", which rebuilds the snapshot from GitHub.',
      );
    }
    try {
      return this.store.watch(id);
    } catch (error) {
      throw new CiWatchError('incompatibleState', error instanceof Error ? error.message : `${error}`);
    }
  }

  /** Whether a failure means polling again cannot help. */
  static fatal(failure: GhFailure): boolean {
    return failure.kind === 'auth' || failure.kind === 'notFound';
  }
}
