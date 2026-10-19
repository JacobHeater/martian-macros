/**
 * Carbohydrate as a US label states it: the total, fiber included (MM-397,
 * the panel's NU-1). An EU label's "carbohydrate" leaves fiber out, so an
 * Open Food Facts product also sold outside the US and Canada may carry
 * that figure instead. Net carbs take fiber away, and would take it twice.
 *
 * For such a product (`label` 'unknown') with fiber stated, the figure is
 * read as available carbohydrate when the stated calories agree better
 * with it (4 kcal a gram for protein and carbohydrate, 9 for fat, 2 for
 * fiber on top), and fiber is added back. Otherwise it is kept as it is.
 */
export function usLabelCarbs({
  label,
  kcal,
  proteinG,
  carbsG,
  fatG,
  fiberG,
}: {
  label: 'us' | 'unknown';
  kcal: number | undefined;
  proteinG: number | undefined;
  carbsG: number | undefined;
  fatG: number | undefined;
  fiberG: number | undefined;
}): number | undefined {
  if (label === 'us' || carbsG === undefined || fiberG === undefined || fiberG <= 0) return carbsG;
  if (kcal === undefined || proteinG === undefined || fatG === undefined) return carbsG;
  const asTotal = Math.abs(4 * proteinG + 4 * carbsG + 9 * fatG - kcal);
  const asAvailable = Math.abs(4 * proteinG + 4 * carbsG + 9 * fatG + 2 * fiberG - kcal);
  return asAvailable < asTotal ? carbsG + fiberG : carbsG;
}
