import type { LimbSide } from '../domain/measurements/LimbSide';
import type { LimbFact } from '../engine/LimbFact';
import type { Fmt } from './Fmt';
import { siteAmount } from './siteAmount';
import { siteLabel } from './siteLabel';

/**
 * A limb's change and the waist's, stated as two facts and nothing more
 * (MM-156): "Upper arm up 1.0 cm in 12 weeks while waist held." A tape
 * cannot tell muscle from fat, so nothing is said about either (MM-133,
 * MM-144).
 */
export function limbFactText(fact: LimbFact, fmt: Fmt, limbSide?: LimbSide): string {
  const weeks = Math.round(fact.days / 7);
  const label = siteLabel(fact.site, limbSide);
  const limb =
    fact.limb.direction === 'noClearChange'
      ? `${label}: no clear change in ${weeks} weeks`
      : `${label} ${fact.limb.direction} ${siteAmount(fact.limb.changeCm, fmt)} in ${weeks} weeks`;
  const waist = fact.waist;
  if (waist === undefined) return `${limb}.`;
  if (waist.direction === 'noClearChange') return `${limb} while waist held.`;
  return `${limb} while waist went ${waist.direction} ${siteAmount(waist.changeCm, fmt)}.`;
}
