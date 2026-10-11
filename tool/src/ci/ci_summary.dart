/// The checks of one commit taken together. It says what CI reported, not
/// whether the pull request may be merged.
enum CiSummary {
  /// No checks were observed. Not the same as passed: they may not have
  /// registered yet, or there may be none.
  none,

  /// At least one check is queued or running, and none has failed.
  pending,
  failed,

  /// A check waits on a person.
  blocked,

  /// A check was cancelled or went stale, and none failed.
  cancelled,

  /// Every check finished and at least one passed; the rest passed, were
  /// skipped or were neutral. The counts say which.
  passed,

  /// Every check finished and none passed: all skipped or neutral.
  inconclusive,

  /// A check is in a state this version does not know.
  unknown,
}
