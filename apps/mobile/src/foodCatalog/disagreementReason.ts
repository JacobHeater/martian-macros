/**
 * The tier reason a pack food carries when two sources' records for its
 * barcode differed by more than 10% (MM-51, MM-383): the one sentence the
 * pipeline writes and the catalog reads back, since the format has no
 * other carrier for the mark (the panel's IN-17). The mark says two
 * sources disagreed, not which was wrong.
 */
export const disagreementReason = 'Two sources disagree about this product by more than 10%. Check it against the package.';
