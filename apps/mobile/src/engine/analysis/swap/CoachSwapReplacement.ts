import type { CoachSwapFigures } from './CoachSwapFigures';

/**
 * What a row of the coach's swap table puts in a food's place (MM-617):
 * the words said to the person, and the figures a time. Either `serving`
 * (typical values for the replacement), or `ofFood` (shares of the food's
 * own figures, for a row that keeps the food and changes how it is made or
 * how much), then `plus` added and `less` taken away.
 */
export interface CoachSwapReplacement {
  /** Words for the person, mid-sentence: "two eggs on an English muffin with a slice of cheese". */
  readonly words: string;
  readonly serving?: CoachSwapFigures | undefined;
  readonly ofFood?: CoachSwapFigures | undefined;
  readonly plus?: CoachSwapFigures | undefined;
  readonly less?: CoachSwapFigures | undefined;
}
