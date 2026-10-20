import { ReliefRule } from './ReliefRule';

const fractions = {
  /** 0.5% of body weight a week: always offered, and the only pace in the caution cases. */
  gentle: 0.005,
  /** 0.75% a week: the default, when the body-fat limit allows it. */
  standard: 0.0075,
  /** 1% a week: only when body fat is clearly high. */
  faster: 0.01,
} as const;

/** The three named fat-loss paces (MM-128), as fractions of body weight a week. */
export type FatLossPace = keyof typeof fractions;

export const FatLossPace = {
  values: ['gentle', 'standard', 'faster'] as readonly FatLossPace[],
  default: 'standard' as FatLossPace,

  fraction(pace: FatLossPace): number {
    return fractions[pace];
  },

  /** The pace a stored fraction names, or undefined for a fraction that is none of the three. */
  of(fraction: number | undefined): FatLossPace | undefined {
    if (fraction === undefined) return FatLossPace.default;
    return FatLossPace.values.find((pace) => Math.abs(fractions[pace] - fraction) < 1e-9);
  },

  /** The paces the relief offer steps down through are these (MM-117). */
  get relief(): readonly number[] {
    return ReliefRule.paces;
  },
} as const;
