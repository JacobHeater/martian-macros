import 'check_observation.dart';
import 'check_state.dart';
import 'ci_summary.dart';
import 'required_discovery.dart';
import 'summarize_checks.dart';

/// A pull request and the checks of its head commit, as read at one moment.
/// Every check in it belongs to [headSha]; a result for any other commit is
/// not in it.
final class PrSnapshot {
  const PrSnapshot({
    required this.repository,
    required this.pr,
    required this.headSha,
    required this.prState,
    required this.checks,
    required this.requiredDiscovery,
    required this.observedAt,
    this.isDraft = false,
    this.mergeable,
    this.mergeStateStatus,
    this.url,
  });

  factory PrSnapshot.fromJson(Map<String, Object?> json) => PrSnapshot(
    repository: json['repository']! as String,
    pr: json['pr']! as int,
    headSha: json['headSha']! as String,
    prState: json['prState']! as String,
    checks: [
      for (final check in json['checks']! as List<Object?>)
        CheckObservation.fromJson(check! as Map<String, Object?>),
    ],
    requiredDiscovery:
        RequiredDiscovery.values.asNameMap()[json['requiredDiscovery']] ??
        RequiredDiscovery.unknown,
    observedAt: json['observedAt']! as String,
    isDraft: json['isDraft'] == true,
    mergeable: json['mergeable'] as String?,
    mergeStateStatus: json['mergeStateStatus'] as String?,
    url: json['url'] as String?,
  );

  /// `owner/name`.
  final String repository;
  final int pr;
  final String headSha;

  /// GitHub's word: `OPEN`, `MERGED` or `CLOSED`.
  final String prState;
  final List<CheckObservation> checks;
  final RequiredDiscovery requiredDiscovery;

  /// When this was read, UTC, ISO 8601.
  final String observedAt;
  final bool isDraft;

  /// GitHub's words on merging, unchanged. They are separate from CI: a
  /// green [ciSummary] does not make these true.
  final String? mergeable;
  final String? mergeStateStatus;
  final String? url;

  bool get open => prState == 'OPEN';

  /// All checks together.
  CiSummary get ciSummary => summarizeChecks(checks);

  /// The required checks together; null unless they were discovered.
  CiSummary? get requiredSummary =>
      requiredDiscovery == RequiredDiscovery.discovered
      ? summarizeChecks(checks.where((check) => check.required))
      : null;

  /// How many checks are in each state.
  Map<String, int> get counts {
    final counts = <String, int>{};
    for (final check in checks) {
      counts.update(check.state.name, (n) => n + 1, ifAbsent: () => 1);
    }
    return counts;
  }

  CheckState? stateOf(String key) {
    for (final check in checks) {
      if (check.key == key) return check.state;
    }
    return null;
  }

  Map<String, Object?> toJson() => {
    'repository': repository,
    'pr': pr,
    'headSha': headSha,
    'prState': prState,
    'isDraft': isDraft,
    'mergeable': mergeable,
    'mergeStateStatus': mergeStateStatus,
    'url': url,
    'observedAt': observedAt,
    'ciSummary': ciSummary.name,
    'requiredDiscovery': requiredDiscovery.name,
    'requiredSummary': requiredSummary?.name,
    'counts': counts,
    'checks': [for (final check in checks) check.toJson()],
  };
}
