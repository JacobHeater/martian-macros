enum TdeeStatus {
  /// Enough data: the estimate reflects observed intake and weight change.
  updated,

  /// Not enough usable data in the window; the prior is returned unchanged
  /// and targets must be held, never guessed.
  held,
}
