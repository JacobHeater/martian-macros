import { beforeEach, describe, expect, it } from 'vitest';
import type { CardioSessionRepository } from '../../src/domain/repositories/CardioSessionRepository';
import { CardioSession } from '../../src/domain/training/CardioSession';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

const minuteMs = 60 * 1000;

/** What every `CardioSessionRepository` must do (MM-677), in memory and in the database. */
export function cardioSessionRepositoryContract(
  name: string,
  create: () => CardioSessionRepository | Promise<CardioSessionRepository>,
): void {
  describe(`${name} as a CardioSessionRepository`, () => {
    let repo: CardioSessionRepository;
    const seven = new Date(2026, 9, 5, 7, 5);
    const walk = new CardioSession({
      platformId: 'hk-walk',
      sourceName: 'Watch',
      activity: 'walking',
      start: seven,
      end: new Date(seven.getTime() + 42 * minuteMs),
    });
    const run = new CardioSession({
      platformId: 'hk-run',
      sourceName: 'Watch',
      activity: 'running',
      start: new Date(2026, 9, 6, 18, 0),
      end: new Date(2026, 9, 6, 18, 30),
    });

    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchCardioSessions())).toEqual([]);
    });

    it('a saved session is read back with every field, newest first', async () => {
      await repo.saveCardioSessions([walk, run]);
      const read = await first(repo.watchCardioSessions());
      expect(read.map((s) => s.platformId)).toEqual(['hk-run', 'hk-walk']);
      const kept = read[1] as CardioSession;
      expect(kept.sourceName).toBe('Watch');
      expect(kept.activity).toBe('walking');
      expect(kept.start).toEqual(seven);
      expect(kept.minutes).toBe(42);
      expect(kept.date.toString()).toBe('2026-10-05');
    });

    it('saving a session again by its platform id changes it and never adds a second (MM-71)', async () => {
      await repo.saveCardioSessions([walk]);
      const moved = new CardioSession({ ...walk, start: new Date(seven.getTime() + 5 * minuteMs), end: walk.end, activity: 'hiking' });
      await repo.saveCardioSessions([moved]);
      const read = await first(repo.watchCardioSessions());
      expect(read).toHaveLength(1);
      expect(read[0]?.activity).toBe('hiking');
      expect(read[0]?.minutes).toBe(37);
    });

    it('saving nothing changes nothing', async () => {
      await repo.saveCardioSessions([walk]);
      await repo.saveCardioSessions([]);
      expect(await first(repo.watchCardioSessions())).toHaveLength(1);
    });

    it('emits what is kept first, then each change', async () => {
      await expectChangeEmits(repo.watchCardioSessions(), {
        before: [],
        change: () => repo.saveCardioSessions([walk]),
        after: [walk],
      });
    });
  });
}
