import type { ReferenceBasis } from '../domain';

const labels: Readonly<Record<ReferenceBasis, string>> = {
  per100g: 'Per 100 g',
  per100ml: 'Per 100 mL',
  perServing: 'Per serving',
};

/** The amount a food's reference nutrition is stated for, as a caption begins (MM-167, MM-153): one spelling everywhere. */
export const referenceBasisLabel = (basis: ReferenceBasis): string => labels[basis];
