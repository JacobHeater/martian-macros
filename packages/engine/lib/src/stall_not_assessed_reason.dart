/// Why a stall was not looked for (MM-140).
enum StallNotAssessedReason {
  /// Maintenance and recomposition have no pace to fall short of.
  noPaceToMeet,

  /// Too early in the phase to tell a stall from noise.
  earlyInPhase,

  /// The coach is still learning (below Fair confidence).
  lowConfidence,

  /// A lasting weight event (creatine) is too recent.
  recentLastingEvent,

  /// Not enough trend to span the window.
  notEnoughTrend,
}
