enum TargetFlag {
  /// The calorie target was raised to the safety floor.
  flooredAtSafetyMinimum,

  /// The user was losing faster than the fastest pace allowed for their
  /// body fat, so the target was raised beyond the usual weekly step (MM-115).
  raisedForSafePace,

  /// The target was not lowered this week because last week's was raised for
  /// a too-fast loss: a raise is not walked straight back (MM-115).
  heldAfterSafetyRaise,

  /// The user kept last week's targets for now, instead of a reduction
  /// (MM-138). Allowed once, never twice running.
  heldByUser,

  /// The change from last week was limited.
  rateLimited,

  /// Continuous deficit hit its limit; this week is at maintenance.
  dietBreak,

  /// Body mass index is below 18.5, so the deficit was replaced by
  /// maintenance (MM-111).
  underweightMaintenance,

  /// The requested mode isn't allowed by the coaching policy; maintenance
  /// was used instead.
  modeNotAllowed,

  /// Protein was capped by the coaching policy.
  proteinCapped,

  /// The user took a maintenance week early, when recovery was failing
  /// (MM-117).
  requestedBreak,
}
