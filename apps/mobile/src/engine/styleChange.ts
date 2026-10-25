import type { IntakeDay } from '../domain/IntakeDay';

const mean = (days: readonly IntakeDay[], share: (d: IntakeDay) => number) =>
  days.reduce((sum, d) => sum + share(d), 0) / days.length;

/**
 * How far apart two runs of days are in logging style (MM-27, MM-46): half
 * the summed change in the shares weighed, by hand and the rest (label
 * servings, measures, estimates). With no hand portions this is the change
 * in weighed share; hand portions to a scale or to labels each count in full.
 */
export function styleChange(before: readonly IntakeDay[], after: readonly IntakeDay[]): number {
  const weighed = mean(after, (d) => d.weighedShare) - mean(before, (d) => d.weighedShare);
  const hand = mean(after, (d) => d.handShare) - mean(before, (d) => d.handShare);
  return (Math.abs(weighed) + Math.abs(hand) + Math.abs(weighed + hand)) / 2;
}
