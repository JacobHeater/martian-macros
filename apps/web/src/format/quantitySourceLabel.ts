import type { QuantitySource } from '../domain';

const labels: Readonly<Record<QuantitySource, string>> = {
  weighed: 'Weighed',
  labelServing: 'Label serving',
  householdMeasure: 'Cup / spoon',
  palm: 'Palm',
  cuppedHand: 'Cupped hand',
  thumb: 'Thumb',
  quickAdd: 'Estimate',
};

export const quantitySourceLabel = (source: QuantitySource): string => labels[source];
