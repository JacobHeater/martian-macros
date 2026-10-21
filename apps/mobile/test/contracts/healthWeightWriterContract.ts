import { beforeEach, describe, expect, it } from 'vitest';
import type { BodyWeightRecord } from '../../src/healthIngest/BodyWeightRecord';
import type { HealthWeightWriter } from '../../src/healthIngest/HealthWeightWriter';
import type { HealthWriting } from '../../src/healthIngest/HealthWriting';

/**
 * What every `HealthWeightWriter` must do (MM-513). `create` gives one
 * with weight off; it is turned on through its own `HealthWriting`, and may
 * be refused.
 */
export function healthWeightWriterContract(
  name: string,
  create: () => Promise<HealthWriting & HealthWeightWriter>,
): void {
  describe(`${name} as HealthWeightWriter`, () => {
    let writer: HealthWriting & HealthWeightWriter;
    const weighIn: BodyWeightRecord = { id: 'martian-macros-weight-ns-2026-10-05', at: new Date(2026, 9, 5, 7, 10), kg: 82.4 };

    beforeEach(async () => {
      writer = await create();
    });

    it('Off: writes and removes nothing while weight is off', async () => {
      expect(await writer.writeWeight(weighIn)).toBe(false);
      expect(await writer.removeWeight(weighIn.id)).toBe(false);
    });

    it('once weight is on, a weigh-in is written, written again under its id, and removed', async () => {
      if (!(await writer.startWriting('weight'))) return;
      expect(await writer.writeWeight(weighIn)).toBe(true);
      expect(await writer.writeWeight({ ...weighIn, kg: 82.1 })).toBe(true);
      expect(await writer.removeWeight(weighIn.id)).toBe(true);
    });

    it('no weight is not written', async () => {
      if (!(await writer.startWriting('weight'))) return;
      expect(await writer.writeWeight({ ...weighIn, kg: 0 })).toBe(false);
    });

    it('food on does not write weight', async () => {
      if (!(await writer.startWriting('food'))) return;
      expect(await writer.writeWeight(weighIn)).toBe(false);
    });

    it('turned off again, nothing more is written', async () => {
      if (!(await writer.startWriting('weight'))) return;
      await writer.stopWriting('weight');
      expect(await writer.writeWeight(weighIn)).toBe(false);
    });
  });
}
