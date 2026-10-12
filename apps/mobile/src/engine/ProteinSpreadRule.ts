/**
 * The thresholds for how protein is spread across meals (MM-125).
 * Judgement: spreading it may help slightly; the daily total matters much
 * more. Tune them here.
 */
export const ProteinSpreadRule = {
  /**
   * A meal with at least this much protein per kg of body weight carries
   * the quiet marker.
   */
  markerGPerKg: 0.3,

  /** A meal with less protein than this has almost none. */
  almostNoneG: 10,
} as const;
