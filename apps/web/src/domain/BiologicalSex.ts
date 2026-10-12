import { FormatError } from '../lang/FormatError';

const values = ['male', 'female'] as const;

/**
 * Biological sex, used by every sex-dependent formula in the engine.
 *
 * Deliberately closed to two values with no "unknown" member: the engine
 * must never fall back to a default. Onboarding cannot complete until the
 * user selects one, and health-platform values outside these two (HealthKit
 * `.other` / `.notSet`; Health Connect has no such field) are ignored.
 */
export type BiologicalSex = (typeof values)[number];

export const BiologicalSex = {
  values,

  /**
   * Parses a persisted value. Throws on anything else, so a corrupt row can
   * never silently become a default.
   */
  parse(value: string): BiologicalSex {
    if (value === 'male' || value === 'female') return value;
    throw new FormatError(`Invalid biological sex: "${value}"`);
  },
} as const;
