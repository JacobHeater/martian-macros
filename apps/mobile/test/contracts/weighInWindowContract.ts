import { beforeEach, describe, expect, it } from 'vitest';
import { WeighInWindow, type WeighInWindowReader, type WeighInWindowWriter } from '../../src/healthIngest';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

const late = new WeighInWindow({ startMinute: 14 * 60, endMinute: 22 * 60 });
// Said as text, so a change is seen as one by value.
const span = (window: WeighInWindow) => `${window.startMinute}-${window.endMinute}`;

/** What every keeper of the weigh-in window must do (MM-441). */
export function weighInWindowContract(
  name: string,
  create: () => (WeighInWindowReader & WeighInWindowWriter) | Promise<WeighInWindowReader & WeighInWindowWriter>,
): void {
  describe(`${name} keeps the weigh-in window`, () => {
    let store: WeighInWindowReader & WeighInWindowWriter;
    beforeEach(async () => {
      store = await create();
    });

    it('is 04:00 to 12:00 until one is chosen', async () => {
      expect(span(await first(store.watchWeighInWindow()))).toEqual('240-720');
    });

    it('keeps a moved window, and going back gives the usual one', async () => {
      await store.saveWeighInWindow(late);
      expect(span(await first(store.watchWeighInWindow()))).toEqual('840-1320');
      await store.saveWeighInWindow(undefined);
      expect(span(await first(store.watchWeighInWindow()))).toEqual('240-720');
    });

    it('gives the window in force first, then each change', async () => {
      await expectChangeEmits(store.watchWeighInWindow(), {
        see: span,
        before: '240-720',
        change: () => store.saveWeighInWindow(late),
        after: '840-1320',
      });
    });
  });
}
