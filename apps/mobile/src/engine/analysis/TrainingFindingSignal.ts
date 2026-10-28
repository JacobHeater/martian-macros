const values = [
  /** T1: no session for 14 days on a deficit or gain (MM-134, reused); or a session in each of 4 weeks. */
  'trainingStopped',
  /** T2: the last 14 days at half the usual rate or less. */
  'trainingDropped',
  /** T3: a major muscle group's weekly hard sets against another's. */
  'setsPerMuscle',
  /** T5: a lift's smoothed estimated max up, on maintenance or lean gain. */
  'strengthRising',
  /** T6: two or more lifts stalled (MM-79), on maintenance or lean gain. */
  'strengthStalled',
  /** T7: lifts falling (MM-117), or held (MM-377), on fat loss. */
  'strengthOnFatLoss',
  /** T8: usual training weekdays. */
  'trainingDays',
  /** T9: reps in reserve rarely recorded, so weekly sets may read high. */
  'rirUnrecorded',
  /** X1: the protein minimum met on training days and rest days. */
  'proteinByTrainingDay',
  /** X3: water logged on training days against the goal and rest days. */
  'waterOnTrainingDays',
  /** C1: the week's cardio minutes from the wearable against the floor (MM-678). */
  'cardioMinutes',
  /** C2: the week's steps a day from the platform against the floor (MM-678). */
  'stepsPerDay',
] as const;

/** The catalog signals of training, water and sleep (MM-609): a `CoachFinding`'s `signal`. */
export type TrainingFindingSignal = (typeof values)[number];

export const TrainingFindingSignal = { values } as const;
