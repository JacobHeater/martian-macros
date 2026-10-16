import type { UnitSystem } from '../UnitSystem';
import { WaterUnits } from './WaterUnits';

const values = ['glass', 'bottle'] as const;

/** A one-tap amount of water (MM-313). */
export type WaterServing = (typeof values)[number];

export const WaterServing = {
  values,

  /** A glass is 250 ml, or 8 fl oz in imperial; a bottle is 500 ml in both. */
  ml(serving: WaterServing, units: UnitSystem): number {
    if (serving === 'bottle') return 500;
    return units === 'imperial' ? WaterUnits.flOzToMl(8) : 250;
  },

  label(serving: WaterServing): string {
    return serving === 'glass' ? 'Glass' : 'Bottle';
  },
} as const;
