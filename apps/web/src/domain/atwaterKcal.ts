/** Energy implied by macros (Atwater 4/4/9), plus alcohol at 7 kcal per gram. */
export function atwaterKcal({
  proteinG,
  carbsG,
  fatG,
  alcoholG = 0,
}: {
  proteinG: number;
  carbsG: number;
  fatG: number;
  alcoholG?: number;
}): number {
  return 4 * proteinG + 4 * carbsG + 9 * fatG + 7 * alcoholG;
}
