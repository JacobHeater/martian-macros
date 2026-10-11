import 'check_observation.dart';
import 'check_state.dart';
import 'ci_summary.dart';

/// Sums up [checks]. The worst state wins; skipped and neutral checks never
/// make a pass by themselves.
CiSummary summarizeChecks(Iterable<CheckObservation> checks) {
  final states = {for (final check in checks) check.state};
  if (states.isEmpty) return CiSummary.none;
  bool any(Set<CheckState> of) => states.any(of.contains);
  if (any({CheckState.failed, CheckState.timedOut})) return CiSummary.failed;
  if (any({CheckState.actionRequired})) return CiSummary.blocked;
  if (any({CheckState.cancelled, CheckState.stale})) return CiSummary.cancelled;
  if (any({CheckState.pending, CheckState.running})) return CiSummary.pending;
  if (any({CheckState.unknown})) return CiSummary.unknown;
  if (any({CheckState.passed})) return CiSummary.passed;
  return CiSummary.inconclusive;
}
