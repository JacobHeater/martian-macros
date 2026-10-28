const values = [
  /** The log is too thin to tell. */
  'data',
  /** Fat is probably being lost and water is hiding it. */
  'masked',
  /** Average intake is off the target in the direction that explains it. */
  'intake',
  /** Steps a day fell against the weeks before the window: moving less is the likeliest cause (MM-678). */
  'activity',
  /** Intake is on target and the data is good: expenditure was misjudged. */
  'estimate',
] as const;

/** Which kind of stall it is (MM-140). The first that applies, in this order. */
export type StallDiagnosis = (typeof values)[number];

export const StallDiagnosis = { values } as const;
