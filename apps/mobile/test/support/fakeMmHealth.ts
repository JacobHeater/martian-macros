import type { MmHealthApi } from '../../src/platform/MmHealthApi';
import type { MmHealthRecord } from '../../src/platform/MmHealthRecord';

/**
 * The native Health Connect plugin stood in for in memory: a record store
 * with a change log, so the adapter's token flow runs without a phone.
 * The history permission (MM-73) is granted when `history` says so, or
 * when asked for the first time if `grantsHistory`; it is asked once.
 */
export function fakeMmHealth(
  records: MmHealthRecord[],
  { permitted, history = false, grantsHistory = true }: { permitted?: string[]; history?: boolean; grantsHistory?: boolean } = {},
) {
  const log: { record?: MmHealthRecord; deletedId?: string }[] = records.map((record) => ({ record }));
  const granted = new Set(permitted ?? ['weight', 'bodyFat', 'leanMass', 'height', 'workout', 'menstruation', 'steps']);
  let historyGranted = history;
  let historyAsked = 0;
  const api: MmHealthApi = {
    status: async () => ({ status: 'available' }),
    permitted: async ({ types }) => ({ types: types.filter((type) => granted.has(type)) }),
    requestPermission: async ({ types }) => {
      for (const type of types) granted.add(type);
      return { types: [...granted] };
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
    change: (entry: { record?: MmHealthRecord; deletedId?: string }) => log.push(entry),
  };
}
