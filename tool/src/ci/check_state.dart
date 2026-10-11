/// The state of one check, normalized across GitHub's check runs and commit
/// statuses. The provider's own words are kept beside it; this is only a
/// summary of them.
enum CheckState {
  /// Queued, requested or expected: registered but not started.
  pending,
  running,
  passed,
  failed,
  cancelled,

  /// Did not run. Not a pass.
  skipped,

  /// Finished without a verdict. Not a pass.
  neutral,

  /// Waiting on a person: an approval, or a reported "action required".
  actionRequired,
  timedOut,

  /// GitHub marked the result stale.
  stale,

  /// A provider state this version does not know.
  unknown,
}
