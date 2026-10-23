import type { QuantitySource } from '../domain';

const labels: Readonly<Record<QuantitySource, string>> = {
  weighed: 'Weighed',
  labelServing: 'Label serving',
  householdMeasure: 'Cup / spoon',
  palm: 'Palm',
  cuppedHand: 'Cupped hand',
  thumb: 'Thumb',
  // Estimated totals typed with no amount (MM-167): told from 'Estimate a meal', the way in, by its full name (MM-219).
  quickAdd: 'Estimated totals',
  // Only an AI meal analysis makes one (MM-586).
  photoEstimate: 'Photo estimate',
};

export const quantitySourceLabel = (source: QuantitySource): string => labels[source];
