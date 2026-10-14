import type { QuantitySource } from '../domain/QuantitySource';
import type { MmIconName } from '../ui/MmIconName';

const icons: Readonly<Record<QuantitySource, MmIconName>> = {
  weighed: 'weighed',
  labelServing: 'serving',
  householdMeasure: 'measure',
  palm: 'hand',
  cuppedHand: 'hand',
  thumb: 'hand',
  quickAdd: 'estimate',
};

/** The icon for how a logged quantity was measured (MM-255), always drawn beside its word. */
export const methodIcon = (source: QuantitySource): MmIconName => icons[source];
