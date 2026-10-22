const values = ['waist', 'neck', 'chest', 'hips', 'upperArm', 'thigh', 'calf'] as const;

/**
 * A place the tape goes (MM-156). Waist is everyone's; the others are
 * optional, each off until the user adds it. Upper arm, thigh and calf are
 * limbs, measured on the one side chosen once.
 */
export type MeasurementSite = (typeof values)[number];

/** What each site is, how it is measured, and what a tape can tell there. */
interface SiteFacts {
  readonly label: string;
  /** The one-line instruction, said beside the drawing. */
  readonly instruction: string;
  /** No adult measurement is outside these: one that is was mistyped or in the wrong unit. */
  readonly minCm: number;
  readonly maxCm: number;
  /**
   * The noise of one entry made as the middle of three readings (judgement,
   * from published measurement error; MM-155 for the waist). A smaller
   * circumference is measured more closely.
   */
  readonly noiseCm: number;
}

const facts: Readonly<Record<MeasurementSite, SiteFacts>> = {
  waist: {
    label: 'Waist',
    instruction: 'Level with the navel, relaxed, at the end of a normal breath out.',
    minCm: 30,
    maxCm: 300,
    noiseCm: 1,
  },
  neck: {
    label: 'Neck',
    instruction: 'Just below the Adam’s apple, the tape sloping slightly down to the front, shoulders relaxed.',
    minCm: 20,
    maxCm: 70,
    noiseCm: 0.5,
  },
  chest: {
    label: 'Chest',
    instruction: 'Across the nipples, arms relaxed at the sides, at the end of a normal breath out.',
    minCm: 50,
    maxCm: 200,
    noiseCm: 1,
  },
  hips: {
    label: 'Hips',
    instruction: 'Around the widest point of the buttocks, feet together, the tape level.',
    minCm: 50,
    maxCm: 220,
    noiseCm: 1,
  },
  upperArm: {
    label: 'Upper arm',
    instruction: 'Arm hanging relaxed, midway between the shoulder and the elbow. Not flexed.',
    minCm: 15,
    maxCm: 70,
    noiseCm: 0.5,
  },
  thigh: {
    label: 'Thigh',
    instruction: 'Standing, weight on both feet, midway between the hip crease and the knee.',
    minCm: 25,
    maxCm: 110,
    noiseCm: 0.8,
  },
  calf: {
    label: 'Calf',
    instruction: 'Standing, weight on both feet, around the widest part of the calf.',
    minCm: 18,
    maxCm: 70,
    noiseCm: 0.5,
  },
};

const limbs: readonly MeasurementSite[] = ['upperArm', 'thigh', 'calf'];

export const MeasurementSite = {
  /** Every site, in the fixed order the measuring session takes them (MM-156). */
  values,
  /** The sites beyond the waist, each off until added. */
  optional: values.filter((site) => site !== 'waist'),
  limbs,
  isLimb: (site: MeasurementSite): boolean => limbs.includes(site),
  facts: (site: MeasurementSite): SiteFacts => facts[site],
  /** Whether `cm` can be a measurement of `site`. */
  plausible: (site: MeasurementSite, cm: number): boolean => cm >= facts[site].minCm && cm <= facts[site].maxCm,
} as const;
