import { ReliefRule } from './ReliefRule';

/**
 * The fat-loss pace one step gentler than `current` (MM-117, MM-128), or
 * undefined when `current` is already the gentlest. An undefined `current`
 * is the default pace.
 */
export function slowerPace(current: number | undefined): number | undefined {
  const pace = current ?? ReliefRule.defaultPace;
  for (const option of ReliefRule.paces) {
    if (option < pace - 1e-9) return option;
  }
  return undefined;
}
