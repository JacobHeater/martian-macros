import type { Clock } from '../domain/integration/Clock';
import { HealthChanges } from '../healthIngest/HealthChanges';
import type { HealthDataType } from '../healthIngest/HealthDataType';
import { HealthDataType as Types } from '../healthIngest/HealthDataType';
import type { HealthHistoryAccess } from '../healthIngest/HealthHistoryAccess';
import { HealthReadFailure } from '../healthIngest/HealthReadFailure';
import type { HealthSample } from '../healthIngest/HealthSample';
import type { HealthSource } from '../healthIngest/HealthSource';
import { healthConnectSample } from './healthConnectSample';
import type { MmHealthApi } from './MmHealthApi';

const sorted = (samples: HealthSample[]): HealthSample[] =>
  samples.sort((a, b) => {
    const byStart = a.start.getTime() - b.start.getTime();
    return byStart !== 0 ? byStart : a.platformId < b.platformId ? -1 : a.platformId > b.platformId ? 1 : 0;
  });

/**
 * Android's Health Connect behind `HealthSource` (MM-68), over the app's
 * own plugin. It only reads: writing is `NativeHealthWriting` (MM-70) and
 * `NativeHealthWorkouts` (MM-489). A read the platform refuses is
 * a rejection from the plugin and `HealthReadFailure` here, never
 * "nothing".
 *
 * It also says whether the history permission is granted (MM-73), and asks
 * for it once.
 */
export class NativeHealthSource implements HealthSource, HealthHistoryAccess {
  /** How far back Health Connect reads without the history permission (MM-498). */
  static readonly windowDays = 30;

  private readonly api: MmHealthApi;

  /** The app's clock (MM-190): the window is counted back from its now. */
  private readonly clock: Pick<Clock, 'now'>;

  constructor(api: MmHealthApi, clock: Pick<Clock, 'now'>) {
    this.api = api;
    this.clock = clock;
  }

  private async asked<T>(what: string, step: () => Promise<T>): Promise<T> {
    try {
      return await step();
    } catch {
      throw new HealthReadFailure(what);
    }
  }

  async available(): Promise<Set<HealthDataType>> {
    const { status } = await this.api.status();
    return status === 'available' ? new Set(Types.values) : new Set();
  }

  async permitted(): Promise<Set<HealthDataType>> {
    const here = await this.available();
    if (here.size === 0) return new Set();
    const { types } = await this.api.permitted({ types: [...here] });
    return new Set(Types.values.filter((type) => types.includes(type) && here.has(type)));
  }

  async requestPermission(types: ReadonlySet<HealthDataType>): Promise<Set<HealthDataType>> {
    const here = await this.available();
    const asked = [...types].filter((type) => here.has(type));
    if (asked.length > 0) await this.api.requestPermission({ types: asked });
    return this.permitted();
  }

  async historyPermitted(): Promise<boolean> {
    if ((await this.available()).size === 0) return false;
    const { granted } = await this.asked('the history permission', () => this.api.historyPermitted());
    return granted;
  }

  async requestHistory(): Promise<boolean> {
    if ((await this.available()).size === 0) return false;
    const { granted } = await this.api.requestHistory();
    return granted;
  }

  /**
   * Without the history permission Health Connect shows the thirty days
   * before the first permission was granted (MM-498). The plugin does not
   * say when that was, so this answers thirty days before the app's now: never
   * earlier than the real window, which keeps a re-read from removing
   * history it cannot see.
   */
  async readableFrom(): Promise<Date | undefined> {
    if (await this.historyPermitted()) return undefined;
    return new Date(this.clock.now().getTime() - NativeHealthSource.windowDays * 24 * 60 * 60 * 1000);
  }

  async read(type: HealthDataType, range: { from: Date; to: Date }): Promise<HealthSample[]> {
    if (range.to.getTime() <= range.from.getTime() || !(await this.permitted()).has(type)) return [];
    const { records } = await this.asked(`reading ${type}`, () =>
      this.api.read({ type, fromMs: range.from.getTime(), toMs: range.to.getTime() }),
    );
    return sorted(
      records
        .map(healthConnectSample)
        .filter(
          (sample): sample is HealthSample =>
            sample !== undefined &&
            sample.type === type &&
            sample.start.getTime() >= range.from.getTime() &&
            sample.start.getTime() < range.to.getTime(),
        ),
    );
  }

  async changesSince(type: HealthDataType, token: string | undefined): Promise<HealthChanges> {
    if (!(await this.permitted()).has(type)) {
      return new HealthChanges({ nextToken: token ?? 'not-permitted' });
    }
    if (token === undefined) {
      // The token first, so nothing written while reading is missed: it
      // comes again with the next changes, which changes nothing.
      const { token: next } = await this.asked(`a token for ${type}`, () => this.api.changesToken({ type }));
      if (next === '') throw new HealthReadFailure(`a token for ${type}`);
      const everything = await this.read(type, { from: new Date(1900, 0, 1), to: new Date(2200, 0, 1) });
      return new HealthChanges({ nextToken: next, upserted: everything });
    }
    const upserted = new Map<string, HealthSample>();
    const deleted = new Set<string>();
    let at = token;
    for (;;) {
      const page = await this.asked(`changes in ${type}`, () => this.api.changes({ token: at }));
      if (page.expired) return HealthChanges.expired();
      for (const id of page.deletedIds) {
        deleted.add(id);
        upserted.delete(id);
      }
      for (const record of page.upserted) {
        const sample = healthConnectSample(record);
        if (sample !== undefined && sample.type === type) {
          upserted.set(sample.platformId, sample);
          deleted.delete(sample.platformId);
        }
      }
      if (page.nextToken !== '') at = page.nextToken;
      if (!page.hasMore) break;
    }
    return new HealthChanges({
      nextToken: at,
      upserted: sorted([...upserted.values()]),
      deletedIds: [...deleted].sort(),
    });
  }
}
