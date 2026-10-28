/**
 * A food a move names (MM-684), a time: the outlier at the portion eaten,
 * a catalog food at its default serving, one of the person's own at its
 * median portion, or the swap table's words.
 */
export interface MoveFood {
  readonly name: string;
  readonly kcal: number;
  readonly proteinG: number;
  readonly fatG?: number | undefined;
  readonly source: 'logged' | 'catalog' | 'own' | 'table';
}
