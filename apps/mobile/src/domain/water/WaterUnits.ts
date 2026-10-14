const mlPerFlOz = 29.5735295625;

/** Water volume conversions for the UI edge (MM-313). Stored in millilitres. */
export const WaterUnits = {
  mlPerFlOz,

  /** The most one entry may be: a large jug. */
  maxEntryMl: 3_000,

  flOzToMl: (flOz: number): number => flOz * mlPerFlOz,
  mlToFlOz: (ml: number): number => ml / mlPerFlOz,
} as const;
