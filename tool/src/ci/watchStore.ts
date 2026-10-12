import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { PrSnapshot } from './prSnapshot.ts';
import type { WatchEvent } from './watchEvent.ts';
import { dedupeKey, watchEventFromJson, watchEventToJson, watchEventWithId } from './watchEvent.ts';
import type { WatchHealth } from './watchHealth.ts';
import { idleHealth, watchHealthFromJson, watchHealthToJson } from './watchHealth.ts';

/**
 * The files of the watches, under one directory that is never committed.
 *
 * Each watch has four files, each with one kind of writer, so that a poll
 * and an acknowledgement at the same moment cannot overwrite each other:
 * - `watch.json`: what is watched. Written when the watch is created.
 * - `state.json`: the latest snapshot and health. Written by the poller.
 * - `events.jsonl`: the events, one per line, appended by the poller.
 * - `consumer.json`: the owner, each reader's cursor and the stop request.
 *   Written by the agent-facing commands.
 *
 * Whole files are replaced by writing a new one beside them and renaming
 * it, so a crash leaves the old file or the new one, never half of one.
 */
export class WatchStore {
  /** The stored format. A file with another version is refused, not guessed at. */
  static readonly schemaVersion = 1;

  /** Where the watches live, under the repository root. */
  static readonly relativePath = '.mm/ci-watch';

  readonly root: string;

  constructor(root: string) {
    this.root = root;
  }

  private dir(id: string): string {
    return `${this.root}/${id}`;
  }

  private file(id: string, name: string): string {
    return `${this.dir(id)}/${name}`;
  }

  exists(id: string): boolean {
    return existsSync(this.file(id, 'watch.json'));
  }

  ids(): string[] {
    if (!existsSync(this.root)) return [];
    return readdirSync(this.root)
      .filter((name) => statSync(`${this.root}/${name}`).isDirectory() && existsSync(`${this.root}/${name}/watch.json`))
      .sort();
  }

  create(id: string, init: { repository: string; pr: number; intervalSeconds: number; createdAt: string }): void {
    mkdirSync(this.dir(id), { recursive: true });
    this.write(id, 'watch.json', {
      schema: WatchStore.schemaVersion,
      watchId: id,
      repository: init.repository,
      pr: init.pr,
      intervalSeconds: init.intervalSeconds,
      createdAt: init.createdAt,
    });
  }

  /** What is watched. Throws for a format this version does not know. */
  watch(id: string): Record<string, unknown> {
    const json = this.read(id, 'watch.json');
    if (json === undefined) throw new SyntaxError(`No watch "${id}".`);
    if (json['schema'] !== WatchStore.schemaVersion) {
      throw new SyntaxError(
        `Watch "${id}" was stored in format ${json['schema']}; this version reads format ${WatchStore.schemaVersion}. Stop it and start it again.`,
      );
    }
    return json;
  }

  snapshot(id: string): PrSnapshot | undefined {
    const json = this.read(id, 'state.json')?.['snapshot'];
    if (typeof json !== 'object' || json === null || Array.isArray(json)) return undefined;
    try {
      return PrSnapshot.fromJson(json as Record<string, unknown>);
    } catch {
      return undefined;
    }
  }

  health(id: string): WatchHealth {
    const json = this.read(id, 'state.json')?.['health'];
    return typeof json === 'object' && json !== null && !Array.isArray(json)
      ? watchHealthFromJson(json as Record<string, unknown>)
      : idleHealth;
  }

  saveState(id: string, { snapshot, health }: { snapshot: PrSnapshot | undefined; health: WatchHealth }): void {
    this.write(id, 'state.json', {
      schema: WatchStore.schemaVersion,
      snapshot: snapshot?.toJson() ?? null,
      health: watchHealthToJson(health),
    });
  }

  /**
   * Every stored event, oldest first. A last line cut short by a crash is
   * not an event and is left out.
   */
  events(id: string): WatchEvent[] {
    const file = this.file(id, 'events.jsonl');
    if (!existsSync(file)) return [];
    const events: WatchEvent[] = [];
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (line.trim() === '') continue;
      try {
        const json: unknown = JSON.parse(line);
        if (typeof json === 'object' && json !== null) events.push(watchEventFromJson(json as Record<string, unknown>));
      } catch {
        // An interrupted write. Nothing after it can be trusted either.
        break;
      }
    }
    return events;
  }

  /**
   * Stores `drafts` after the events already there, giving each the next
   * id, and returns them as stored. They are on disk when this returns.
   *
   * A draft whose change is already stored for the latest snapshot is left
   * out, so a poll repeated after a crash adds nothing twice.
   */
  append(id: string, drafts: readonly WatchEvent[]): WatchEvent[] {
    if (drafts.length === 0) return [];
    const file = this.file(id, 'events.jsonl');
    const existing = this.events(id);
    this.dropTornTail(file, existing);
    let next = (existing.at(-1)?.id ?? this.prunedThrough(id)) + 1;
    // What a previous, interrupted poll already stored about this same
    // observation.
    const lastSaved = this.snapshot(id)?.observedAt;
    const repeated = new Set(
      existing.filter((event) => lastSaved === undefined || event.at > lastSaved).map((event) => dedupeKey(event)),
    );
    const stored: WatchEvent[] = [];
    let text = '';
    for (const draft of drafts) {
      if (repeated.has(dedupeKey(draft))) continue;
      const event = watchEventWithId(draft, next);
      next += 1;
      text += `${JSON.stringify(watchEventToJson(event))}\n`;
      stored.push(event);
    }
    if (text !== '') appendFileSync(file, text, { flush: true });
    return stored;
  }

  /** Removes a half-written last line, so the next event starts on its own. */
  private dropTornTail(file: string, whole: readonly WatchEvent[]): void {
    if (!existsSync(file)) return;
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n').filter((line) => line.trim() !== '').length;
    if (lines === whole.length && (text === '' || text.endsWith('\n'))) return;
    WatchStore.replace(file, whole.map((event) => `${JSON.stringify(watchEventToJson(event))}\n`).join(''));
  }

  /**
   * Who owns the watch, where each reader has got to, and whether it was
   * asked to stop.
   */
  consumer(id: string): Record<string, unknown> {
    return (
      this.read(id, 'consumer.json') ?? {
        schema: WatchStore.schemaVersion,
        owner: null,
        cursors: {},
        stopRequested: false,
        prunedThrough: 0,
      }
    );
  }

  saveConsumer(id: string, consumer: Record<string, unknown>): void {
    this.write(id, 'consumer.json', { ...consumer, schema: WatchStore.schemaVersion });
  }

  private prunedThrough(id: string): number {
    return (this.consumer(id)['prunedThrough'] as number | undefined) ?? 0;
  }

  /**
   * Forgets the events up to and including `through`. Only for a watch
   * nothing is polling; the caller checks that and that they were read.
   */
  prune(id: string, through: number): void {
    const kept = this.events(id).filter((event) => event.id > through);
    WatchStore.replace(
      this.file(id, 'events.jsonl'),
      kept.map((event) => `${JSON.stringify(watchEventToJson(event))}\n`).join(''),
    );
    this.saveConsumer(id, { ...this.consumer(id), prunedThrough: through });
  }

  delete(id: string): void {
    rmSync(this.dir(id), { recursive: true, force: true });
  }

  private read(id: string, name: string): Record<string, unknown> | undefined {
    const file = this.file(id, name);
    if (!existsSync(file)) return undefined;
    try {
      const json: unknown = JSON.parse(readFileSync(file, 'utf8'));
      return typeof json === 'object' && json !== null && !Array.isArray(json) ? (json as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  }

  private write(id: string, name: string, json: Record<string, unknown>): void {
    WatchStore.replace(this.file(id, name), `${JSON.stringify(json, null, 2)}\n`);
  }

  private static replace(file: string, content: string): void {
    const temp = `${file}.tmp`;
    writeFileSync(temp, content, { flush: true });
    renameSync(temp, file);
  }
}
