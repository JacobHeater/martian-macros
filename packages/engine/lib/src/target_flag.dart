enum TargetFlag {
  /// The calorie target was raised to the safety floor.
  flooredAtSafetyMinimum,

  /// The change from last week was limited.
  rateLimited,

  /// Continuous deficit hit its limit; this week is at maintenance.
  dietBreak,

  /// The requested mode isn't allowed by the coaching policy; maintenance
  /// was used instead.
  modeNotAllowed,

  /// Protein was capped by the coaching policy.
  proteinCapped,
}
