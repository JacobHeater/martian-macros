import type { MmHealthApi } from '../../src/platform/MmHealthApi';
import type { MmHealthRecord } from '../../src/platform/MmHealthRecord';

/**
 * The native Health Connect plugin stood in for in memory: a record store
 * with a change log, so the adapter's token flow runs without a phone.
 * The history permission (MM-73) is granted when `history` says so, or
 * when asked for the first time if `grantsHistory`; it is asked once.
 * Kinds in `stopsAsking` come back refused without the question shown, as
 * Health Connect answers once it stops asking (MM-323); `opens` says
 * whether its screen of the app's permissions opens.
 *
 * A day's steps (MM-442) are the platform's own totals, `stepDays`, as
 * the platform would give them after applying its source priority; with
 * none given, the step records' counts by the day they start on.
 */
export function fakeMmHealth(
  records: MmHealthRecord[],
  {
    permitted,
    history = false,
    grantsHistory = true,
    stepDays,
    stopsAsking = [],
    opens = true,
  }: {
    permitted?: string[];
    history?: boolean;
    grantsHistory?: boolean;
    stepDays?: { startMs: number; steps: number }[];
    stopsAsking?: string[];
    opens?: boolean;
  } = {},
) {
  const log: { record?: MmHealthRecord; deletedId?: string }[] = records.map((record) => ({ record }));
  const granted = new Set(permitted ?? ['weight', 'bodyFat', 'leanMass', 'height', 'workout', 'menstruation', 'steps']);
  let historyGranted = history;
  let historyAsked = 0;
  let permissionsOpened = 0;
  const dailyStepsAsked: { fromMs: number; toMs: number }[] = [];
  const api: MmHealthApi = {
    status: async () => ({ status: 'available' }),
    permitted: async ({ types }) => ({ types: types.filter((type) => granted.has(type)) }),
    requestPermission: async ({ types }) => {
      // Health Connect shows nothing when every kind asked for is one it stopped asking about.
      const shown = types.some((type) => !stopsAsking.includes(type));
      for (const type of types) if (!stopsAsking.includes(type)) granted.add(type);
      return { types: [...granted], shown };
    },
    openPermissions: async () => {
      if (opens) permissionsOpened++;
      return { opened: opens };
    },
    historyPermitted: async () => ({ granted: historyGranted }),
    requestHistory: async () => {
      // The question is shown the first time only, as the plugin does.
      if (historyAsked === 0) {
        historyAsked++;
        if (grantsHistory) historyGranted = true;
      }
      return { granted: historyGranted };
    },
    read: async ({ type, fromMs, toMs }) => ({
      records: log
        .map((entry) => entry.record)
        .filter(
          (record): record is MmHealthRecord =>
            record !== undefined && record.type === type && record.startMs >= fromMs && record.startMs < toMs,
        ),
    }),
    dailySteps: async ({ fromMs, toMs }) => {
      dailyStepsAsked.push({ fromMs, toMs });
      if (stepDays !== undefined) return { days: stepDays };
      const totals = new Map<number, number>();
      for (const { record } of log) {
        if (record === undefined || record.type !== 'steps' || record.startMs < fromMs || record.startMs >= toMs) continue;
        const at = new Date(record.startMs);
        const midnight = new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();
        totals.set(midnight, (totals.get(midnight) ?? 0) + (record.value ?? 0));
      }
      return { days: [...totals].map(([startMs, steps]) => ({ startMs, steps })) };
    },
    changesToken: async ({ type }) => ({ token: `${type}@${log.length}` }),
    changes: async ({ token }) => {
      const found = /^(\w+)@(\d+)$/.exec(token);
      if (found === null) return { expired: true, nextToken: '', hasMore: false, upserted: [], deletedIds: [] };
      const [, type, from] = found;
      const after = log.slice(Number(from));
      return {
        expired: false,
        nextToken: `${type}@${log.length}`,
        hasMore: false,
        upserted: after.map((entry) => entry.record).filter((r): r is MmHealthRecord => r !== undefined && r.type === type),
        deletedIds: after.map((entry) => entry.deletedId).filter((id): id is string => id !== undefined),
      };
    },
  };
  return {
    api,
    /** How many times the history question was shown. */
    historyAsked: () => historyAsked,
    /** How many times Health Connect's screen of the app's permissions was opened (MM-323). */
    permissionsOpened: () => permissionsOpened,
    /** The ranges a day's steps were asked for over (MM-442). */
    dailyStepsAsked: () => dailyStepsAsked,
    change: (entry: { record?: MmHealthRecord; deletedId?: string }) => log.push(entry),
  };
}
