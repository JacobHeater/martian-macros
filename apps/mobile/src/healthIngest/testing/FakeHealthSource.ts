import { ArgumentError } from '../../lang/ArgumentError';
import { byName } from '../../lang/byName';
import { compareStrings } from '../../lang/compareStrings';
import { byStartThenId } from '../byStartThenId';
import { HealthChanges } from '../HealthChanges';
import { HealthDataType } from '../HealthDataType';
import type { HealthHistoryAccess } from '../HealthHistoryAccess';
import type { HealthPermissionsPlace } from '../HealthPermissionsPlace';
import { HealthReadFailure } from '../HealthReadFailure';
import type { HealthSample } from '../HealthSample';
import type { HealthSource } from '../HealthSource';

/** One recorded event, as it is written in a history. */
type RecordedEvent = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function text(event: RecordedEvent, key: string): string {
  const value = event[key];
  if (typeof value !== 'string') throw new ArgumentError(`A recorded event needs "${key}" as text.`);
  return value;
}

const typeOf = (event: RecordedEvent) => byName(HealthDataType.values, event['type']);

/**
 * A `HealthSource` that replays a recorded history (MM-67), so everything
 * above the seam runs with no phone.
 *
 * The history is a list of events in the order they happened: a reading
 * added, edited or deleted. A test shows the source the first few
 * (`happened`) and lets more happen later, as a platform changes between
 * two imports. Tokens are honored until `expireTokens`.
 *
 * With `historyFrom` set it keeps the app to a window as Health Connect
 * does (MM-73): readings that start before it are not shown until the
 * history permission is granted. Unset, as on Apple Health, there is no
 * window and history counts as granted.
 *
 * Kinds in `stopsAsking` are ones the platform no longer shows the app's
 * request for (MM-323): asked for, they come back refused at once.
 */
export class FakeHealthSource implements HealthSource, HealthHistoryAccess, HealthPermissionsPlace {
  private readonly sources: ReadonlyMap<string, string>;
  private readonly events: readonly RecordedEvent[];

  /** How many of the recorded events have taken place. */
  happened: number;

  /** What the user would allow if asked; everything by default. */
  willPermit: ReadonlySet<HealthDataType> | undefined;

  /**
   * While set, the platform cannot be read, as when the app is not in the
   * foreground: reading throws `HealthReadFailure`.
   */
  unreadable = false;

  /**
   * The start of the window the app may read without the history
   * permission, or undefined for a platform with no window (MM-73).
   */
  historyFrom: Date | undefined = undefined;

  /** Whether the user would grant the history permission if asked. */
  willPermitHistory = true;

  /** How many times the user was shown the history question. */
  historyAsked = 0;

  /** The kinds the platform no longer asks about (MM-323). */
  stopsAsking: ReadonlySet<HealthDataType> = new Set();

  /** Whether the platform's screen of the app's permissions can be opened (MM-323). */
  opensPermissions = true;

  /** How many times that screen was opened. */
  permissionsOpened = 0;

  /** The kinds whose last request came back without being shown. */
  private readonly unshown = new Set<HealthDataType>();

  private readonly allowed = new Set<HealthDataType>();
  private historyAllowed = false;
  private generation = 0;

  private constructor(sources: ReadonlyMap<string, string>, events: readonly RecordedEvent[], happened: number) {
    this.sources = sources;
    this.events = events;
    this.happened = happened;
  }

  /**
   * Reads a history: `{"sources": [{"id", "name"}], "events": [{"op":
   * "add" | "edit" | "delete", "type", "id", "value", "start", "end"?,
   * "source"}]}`, as in `recordedHealthHistory` or a file of the same
   * shape. Times are local, in ISO 8601. With `happened`, only that many
   * events have taken place yet.
   */
  static fromJson(json: string, { happened }: { happened?: number | undefined } = {}): FakeHealthSource {
    const decoded: unknown = JSON.parse(json);
    if (!isRecord(decoded) || !Array.isArray(decoded['sources']) || !Array.isArray(decoded['events'])) {
      throw new ArgumentError('A recorded history has "sources" and "events".');
    }
    const sources = new Map<string, string>();
    for (const source of decoded['sources'] as unknown[]) {
      if (!isRecord(source)) throw new ArgumentError('A recorded source is an object.');
      sources.set(text(source, 'id'), text(source, 'name'));
    }
    const events = (decoded['events'] as unknown[]).map((event) => {
      if (!isRecord(event)) throw new ArgumentError('A recorded event is an object.');
      return event;
    });
    return new FakeHealthSource(sources, events, happened ?? events.length);
  }

  /** Lets every recorded event take place. */
  letAllHappen(): void {
    this.happened = this.events.length;
  }

  /** Makes every token issued so far one the platform no longer honors. */
  expireTokens(): void {
    this.generation++;
  }

  /** Permits `types`, or everything available, without asking. */
  async permit(types?: ReadonlySet<HealthDataType>): Promise<void> {
    for (const type of types ?? (await this.available())) this.allowed.add(type);
  }

  /** Grants the history permission without asking (MM-73). */
  permitHistory(): void {
    this.historyAllowed = true;
  }

  /** Takes the history permission away again (MM-73). */
  revokeHistory(): void {
    this.historyAllowed = false;
  }

  /** Whether `sample` is inside what the app may read just now (MM-73). */
  private visible(sample: HealthSample): boolean {
    return this.historyFrom === undefined || this.historyAllowed || sample.start.getTime() >= this.historyFrom.getTime();
  }

  /** Takes permission away again, as the user can in the phone's settings. */
  revoke(types?: ReadonlySet<HealthDataType>): void {
    if (types === undefined) {
      this.allowed.clear();
    } else {
      for (const type of types) this.allowed.delete(type);
    }
  }

  private sample(event: RecordedEvent): HealthSample {
    const source = text(event, 'source');
    const value = event['value'];
    const end = event['end'];
    if (typeof value !== 'number') throw new ArgumentError('A recorded reading needs a number as its value.');
    return {
      platformId: text(event, 'id'),
      type: typeOf(event),
      value,
      start: new Date(text(event, 'start')),
      end: typeof end === 'string' ? new Date(end) : undefined,
      sourceId: source,
      sourceName: this.sources.get(source) ?? source,
    };
  }

  /** The readings of `type` as they stand after the first `count` events. */
  private state(type: HealthDataType, count: number): Map<string, HealthSample> {
    const state = new Map<string, HealthSample>();
    for (const event of this.events.slice(0, count)) {
      if (typeOf(event) !== type) continue;
      const id = text(event, 'id');
      if (event['op'] === 'delete') {
        state.delete(id);
      } else {
        // Set again so an edited reading keeps the place it was added at.
        state.set(id, this.sample(event));
      }
    }
    return state;
  }

  async available(): Promise<Set<HealthDataType>> {
    return new Set(this.events.map(typeOf));
  }

  async permitted(): Promise<Set<HealthDataType>> {
    return new Set(this.allowed);
  }

  async requestPermission(types: ReadonlySet<HealthDataType>): Promise<Set<HealthDataType>> {
    const here = await this.available();
    for (const type of types) {
      if (!here.has(type)) continue;
      if (this.stopsAsking.has(type) && !this.allowed.has(type)) {
        this.unshown.add(type);
        continue;
      }
      this.unshown.delete(type);
      if (this.willPermit?.has(type) ?? true) this.allowed.add(type);
    }
    return this.permitted();
  }

  async stoppedAsking(type: HealthDataType): Promise<boolean> {
    return this.unshown.has(type);
  }

  async openPermissions(): Promise<boolean> {
    if (!this.opensPermissions) return false;
    this.permissionsOpened++;
    return true;
  }

  async historyPermitted(): Promise<boolean> {
    return this.historyFrom === undefined || this.historyAllowed;
  }

  async requestHistory(): Promise<boolean> {
    // Asked once ever, as the plugin does; after that it only says how it stands.
    if (this.historyFrom !== undefined && this.historyAsked === 0) {
      this.historyAsked++;
      if (this.willPermitHistory) this.historyAllowed = true;
    }
    return this.historyPermitted();
  }

  async read(type: HealthDataType, { from, to }: { from: Date; to: Date }): Promise<HealthSample[]> {
    if (!this.allowed.has(type)) return [];
    if (this.unreadable) throw new HealthReadFailure(`reading ${type}`);
    return [...this.state(type, this.happened).values()]
      .filter((s) => this.visible(s) && s.start.getTime() >= from.getTime() && s.start.getTime() < to.getTime())
      .sort(byStartThenId);
  }

  async changesSince(type: HealthDataType, token: string | undefined): Promise<HealthChanges> {
    const next = `${this.generation}:${this.happened}`;
    if (!this.allowed.has(type)) return new HealthChanges({ nextToken: next });
    if (this.unreadable) throw new HealthReadFailure(`changes in ${type}`);

    if (token === undefined) {
      return new HealthChanges({
        nextToken: next,
        upserted: [...this.state(type, this.happened).values()].filter((s) => this.visible(s)).sort(byStartThenId),
      });
    }
    const parts = token.split(':');
    const seenText = parts[1];
    const seen = parts.length === 2 && seenText !== undefined && /^\d+$/.test(seenText) ? Number(seenText) : undefined;
    if (seen === undefined || parts[0] !== `${this.generation}` || seen > this.happened) {
      return HealthChanges.expired();
    }

    const now = this.state(type, this.happened);
    const touched = new Set<string>();
    for (const event of this.events.slice(seen, this.happened)) {
      if (typeOf(event) === type) touched.add(text(event, 'id'));
    }
    const upserted: HealthSample[] = [];
    const deletedIds: string[] = [];
    for (const id of touched) {
      const sample = now.get(id);
      if (sample === undefined) {
        deletedIds.push(id);
      } else {
        upserted.push(sample);
      }
    }
    return new HealthChanges({
      nextToken: next,
      upserted: upserted.sort(byStartThenId),
      deletedIds: deletedIds.sort(compareStrings),
    });
  }
}
