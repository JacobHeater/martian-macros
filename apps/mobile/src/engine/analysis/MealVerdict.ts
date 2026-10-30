/**
 * What the coach makes of a meal (MM-711): `fine`, nothing in it to fix;
 * `drag`, a food in it worth a move; `order`, the meal itself fine but the
 * day needing its order (over, the protein unable to fit, or tight).
 */
export type MealVerdict = 'fine' | 'drag' | 'order';
