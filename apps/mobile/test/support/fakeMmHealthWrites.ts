import type { MmHealthApi } from '../../src/platform/MmHealthApi';
import type { MmHealthNutrition } from '../../src/platform/MmHealthNutrition';
import type { MmHealthWorkout } from '../../src/platform/MmHealthWorkout';
import type { MmHealthWorkoutsApi } from '../../src/platform/MmHealthWorkoutsApi';
import type { MmHealthWritingApi } from '../../src/platform/MmHealthWritingApi';

/**
 * The native health plugin's writing and workouts stood in for in memory
 * (MM-70, MM-314, MM-489), as the Kotlin and Swift plugins behave: a kind
 * is on once its write permission is granted when asked (`grants`), and
 * off when turned off; a write while a kind is off is not made. Records
 * are kept by the app's id for them, so writing again replaces one.
 * Reading workouts needs `readsWorkouts`.
 */
export function fakeMmHealthWrites({
  grants = ['food', 'water', 'workouts'],
  workouts = [],
  readsWorkouts = true,
}: { grants?: string[]; workouts?: MmHealthWorkout[]; readsWorkouts?: boolean } = {}) {
  const granted = new Set<string>();
  const on = new Set<string>();
  const asked: string[] = [];
  const nutrition = new Map<string, MmHealthNutrition>();
  const water = new Map<string, { id: string; atMs: number; ml: number }>();
  const held = new Map<string, MmHealthWorkout>(workouts.map((w): [string, MmHealthWorkout] => [w.id, w]));
  const writes = (kind: string) => on.has(kind) && granted.has(kind);
  const api: Pick<MmHealthApi, 'status' | 'permitted'> & MmHealthWritingApi & MmHealthWorkoutsApi = {
    status: async () => ({ status: 'available' }),
    permitted: async ({ types }) => ({ types: types.filter((type) => type === 'workout' && readsWorkouts) }),
    writing: async ({ kinds }) => ({ kinds: kinds.filter(writes) }),
    startWriting: async ({ kind }) => {
      asked.push(kind);
      if (grants.includes(kind)) granted.add(kind);
      if (granted.has(kind)) on.add(kind);
      return { on: writes(kind) };
    },
    stopWriting: async ({ kind }) => {
      on.delete(kind);
      return { on: false };
    },
    writeNutrition: async (record) => {
      if (!writes('food')) return { written: false };
      nutrition.set(record.id, record);
      return { written: true };
    },
    removeNutrition: async ({ id }) => ({ removed: writes('food') && nutrition.delete(id) }),
    writeWater: async (record) => {
      if (!writes('water')) return { written: false };
      water.set(record.id, record);
      return { written: true };
    },
    removeWater: async ({ id }) => ({ removed: writes('water') && water.delete(id) }),
    readWorkouts: async ({ fromMs, toMs }) => ({
      workouts: [...held.values()].filter((w) => w.startMs >= fromMs && w.startMs < toMs),
    }),
    writeWorkout: async ({ clientId, startMs, endMs, segments }) => {
      if (!writes('workouts')) return { written: false };
      const id = `hc-${clientId}`;
      held.set(id, {
        id,
        clientId,
        strength: true,
        startMs,
        endMs,
        sourceId: 'com.martianmacros',
        sourceName: 'Martian Macros',
        segments,
      });
      return { written: true };
    },
  };
  return {
    api,
    /** The kinds the user was asked to let the app write, in order. */
    asked: () => [...asked],
    nutrition,
    water,
    /** Every workout the platform holds, by its id. */
    workouts: held,
  };
}
