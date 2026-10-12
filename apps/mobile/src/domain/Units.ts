const kgPerLb = 0.45359237;
const cmPerInch = 2.54;

/** Unit conversions for the UI edge. The domain and engine are SI-only. */
export const Units = {
  kgPerLb,
  cmPerInch,

  lbToKg: (lb: number): number => lb * kgPerLb,
  kgToLb: (kg: number): number => kg / kgPerLb,
  inchesToCm: (inches: number): number => inches * cmPerInch,
  cmToInches: (cm: number): number => cm / cmPerInch,
} as const;
