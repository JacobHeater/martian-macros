/**
 * The figures of a meal's moves (MM-684), chosen without asking and marked
 * so in the ticket.
 */
export const MoveRule = {
  /** A lean protein food has at least this share of its calories from protein. */
  leanProteinShare: 0.5,
  /** A food logged as at least this many usual servings is cut to one; under it, to half. */
  cutToOneServingFrom: 1.5,
  /** A cut keeps this share of the food when it is not cut to one serving. */
  halfKept: 0.5,
  /** A protein food added to a meal costs at most this many calories. */
  addMaxKcal: 300,
  /** The outlier is worth a move only from this many calories. */
  outlierMinKcal: 150,
} as const;
