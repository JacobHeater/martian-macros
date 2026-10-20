const values = [
  'weightEvent',
  'carbohydrate',
  'sodium',
  'calories',
  'alcohol',
  'workout',
  'cycleWindow',
  'phaseChange',
] as const;

/**
 * What in the person's own log can move the scale without moving tissue
 * (MM-142), in the order they are listed when several hold: what the person
 * noted themselves first, then yesterday's food, then training, the cycle
 * and a change of phase.
 */
export type WeightJumpCauseKind = (typeof values)[number];

export const WeightJumpCauseKind = { values } as const;
