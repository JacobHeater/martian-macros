enum ModeReason {
  /// Policy forbids deficits (screening).
  deficitNotAllowed,

  /// Body fat high enough that faster visible loss matters most.
  highBodyFat,

  /// Novice, returning, or high body fat: recomp is realistic (Barakat 2020).
  recompEligible,

  /// Lean and trained: building needs a surplus.
  leanAndTrained,

  /// Default: trained, moderate body fat, so cut first.
  cutFirst,
}
