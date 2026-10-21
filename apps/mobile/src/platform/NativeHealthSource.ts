import { HealthChanges } from '../healthIngest/HealthChanges';
import type { Clock } from '../domain/integration/Clock';
import type { DaySteps } from '../healthIngest/DaySteps';
import type { HealthDailySteps } from '../healthIngest/HealthDailySteps';
import type { HealthDataType } from '../healthIngest/HealthDataType';
import { HealthDataType as Types } from '../healthIngest/HealthDataType';
import type { HealthHistoryAccess } from '../healthIngest/HealthHistoryAccess';
import type { HealthPermissionsPlace } from '../healthIngest/HealthPermissionsPlace';
import { HealthReadFailure } from '../healthIngest/HealthReadFailure';
import type { HealthSample } from '../healthIngest/HealthSample';
import type { HealthSource } from '../healthIngest/HealthSource';
import { localMidnight } from '../healthIngest/localMidnight';
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
 * for it once, and reads a day's steps as the platform totals them
 * (MM-442), never by adding up its readings. It remembers, while the
 * app runs, which kinds came back refused without the question being
 * shown (MM-323), and opens Health Connect's screen of the app's
 * permissions where `opensPermissions` says the shell has one (Android,
 * not an iPhone).
 */
export class NativeHealthSource implements HealthSource, HealthHistoryAccess, HealthDailySteps, HealthPermissionsPlace {
  private readonly api: MmHealthApi;
  /** The app's clock (MM-498). */
  private readonly clock: Pick<Clock, 'now'>;
  private readonly opensPermissions: boolean;
  private readonly unshown = new Set<HealthDataType>();

  constructor(api: MmHealthApi, clock: Pick<Clock, 'now'>, { opensPermissions = false }: { opensPermissions?: boolean } = {}) {
    this.api = api;
    this.clock = clock;
    this.opensPermissions = opensPermissions;
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
    if (asked.length === 0) return this.permitted();
    const { shown } = await this.api.requestPermission({ types: asked });
    const after = await this.permitted();
    for (const type of asked) {
      // Only a refusal that came back unshown means the platform stopped asking (MM-323).
      if (shown === false && !after.has(type)) this.unshown.add(type);
      else this.unshown.delete(type);
    }
    return after;
  }

  async stoppedAsking(type: HealthDataType): Promise<boolean> {
    return this.unshown.has(type);
  }

  async openPermissions(): Promise<boolean> {
    if (!this.opensPermissions) return false;
    try {
      const { opened } = await this.api.openPermissions();
      return opened;
    } catch {
      return false;
    }
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

  async dailySteps(range: { from: Date; to: Date }): Promise<DaySteps[]> {
    const from = localMidnight(range.from);
    const to = localMidnight(range.to);
    if (to.getTime() <= from.getTime() || !(await this.permitted()).has('steps')) return [];
    const { days } = await this.asked('daily steps', () => this.api.dailySteps({ fromMs: from.getTime(), toMs: to.getTime() }));
    // One answer a day, at its local midnight, within the range; the platform's total as it is, rounded to a whole step.
    const byDay = new Map<number, number>();
    for (const { startMs, steps } of days) {
      const day = localMidnight(new Date(startMs)).getTime();
      const whole = Math.round(steps);
      if (day < from.getTime() || day >= to.getTime() || !Number.isFinite(whole) || whole <= 0) continue;
      byDay.set(day, whole);
    }
    return [...byDay.keys()].sort((a, b) => a - b).map((day) => ({ day: new Date(day), steps: byDay.get(day) as number }));
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
