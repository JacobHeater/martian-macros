import 'check_state.dart';

/// Normalizes a check run's `status` and `conclusion`, or a commit status's
/// `state` (pass it as [status] with no [conclusion]), as `gh` reports them.
/// Anything not recognized is [CheckState.unknown], never assumed to be good.
CheckState normalizeCheckState(String? status, String? conclusion) {
  final s = (status ?? '').toUpperCase();
  final c = (conclusion ?? '').toUpperCase();
  switch (s) {
    case 'QUEUED' || 'PENDING' || 'REQUESTED' || 'EXPECTED':
      return CheckState.pending;
    case 'WAITING':
      return CheckState.actionRequired;
    case 'IN_PROGRESS':
      return CheckState.running;
    // Commit statuses have no conclusion; their state is the verdict.
    case 'SUCCESS':
      return CheckState.passed;
    case 'FAILURE' || 'ERROR':
      return CheckState.failed;
    case 'COMPLETED':
      return switch (c) {
        'SUCCESS' => CheckState.passed,
        'FAILURE' || 'STARTUP_FAILURE' => CheckState.failed,
        'CANCELLED' => CheckState.cancelled,
        'SKIPPED' => CheckState.skipped,
        'NEUTRAL' => CheckState.neutral,
        'TIMED_OUT' => CheckState.timedOut,
        'ACTION_REQUIRED' => CheckState.actionRequired,
        'STALE' => CheckState.stale,
        _ => CheckState.unknown,
      };
    default:
      return CheckState.unknown;
  }
}
