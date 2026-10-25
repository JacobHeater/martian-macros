/**
 * One normalized word of a food's name (MM-617), which comma- or
 * bracket-separated part of the name it is in, and whether it is a stop
 * word (brand or packaging noise: "inc", "oz", "pack"), which a phrase may
 * include ("juice pack", "jack in the box") but which never means anything
 * alone.
 */
export interface FoodToken {
  readonly word: string;
  readonly part: number;
  readonly stop: boolean;
}
