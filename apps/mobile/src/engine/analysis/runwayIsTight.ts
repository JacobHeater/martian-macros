import { RunwayRule } from './RunwayRule';

/**
 * Whether the rest of the day is tight (MM-713): the protein density it
 * needs is over `RunwayRule.tightDensity`, or over the day's own target
 * density by `RunwayRule.tightOverTarget`, whichever is higher. A day
 * that needs 38% against a 34% target is on track; one that needs 62% is
 * lean protein only from here.
 */
export function runwayIsTight(requiredDensity: number, targetDensity: number): boolean {
  return requiredDensity > Math.max(RunwayRule.tightDensity, targetDensity + RunwayRule.tightOverTarget);
}
