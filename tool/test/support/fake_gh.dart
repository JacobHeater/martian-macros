import 'dart:convert';

import '../../src/ci/gh_result.dart';
import '../../src/ci/gh_runner.dart';

/// A pretend GitHub behind the `gh` boundary: a test sets what the pull
/// request looks like and the watch reads it as it would the real one.
/// Every observation it serves is simulated.
final class FakeGh implements GhRunner {
  String repository = 'octo/app';
  String head = 'a1';
  String prState = 'OPEN';
  String mergeable = 'MERGEABLE';
  String mergeStateStatus = 'CLEAN';

  /// The checks of [head], in the shape `gh pr view --json
  /// statusCheckRollup` gives.
  List<Map<String, Object?>> rollup = [];

  /// The required checks: a list of `{name, workflow}`, or null for "no
  /// required checks reported", or a [GhResult] to answer with instead.
  Object? required;

  /// When set, every call fails with it.
  GhResult? failure;

  /// Heads to report, one per call, when only the head is asked for; used
  /// to move the head in the middle of a read. Empty means [head].
  final headsOnRecheck = <String>[];

  /// Every argument list it was run with.
  final calls = <List<String>>[];

  static Map<String, Object?> checkRun(
    String name, {
    String status = 'COMPLETED',
    String conclusion = '',
    String workflow = 'CI',
    String startedAt = '2026-10-11T10:00:00Z',
    int job = 1,
  }) => {
    '__typename': 'CheckRun',
    'name': name,
    'workflowName': workflow,
    'status': status,
    'conclusion': conclusion,
    'detailsUrl': 'https://github.example/octo/app/actions/runs/7/job/$job',
    'startedAt': startedAt,
    'completedAt': status == 'COMPLETED'
        ? '2026-10-11T10:05:00Z'
        : '0001-01-01T00:00:00Z',
  };

  static Map<String, Object?> status(String context, String state) => {
    '__typename': 'StatusContext',
    'context': context,
    'state': state,
    'targetUrl': 'https://ci.example/$context',
  };

  @override
  Future<GhResult> run(List<String> args) async {
    calls.add(args);
    final failing = failure;
    if (failing != null) return failing;
    if (args.take(2).join(' ') == 'repo view') {
      return GhResult(
        exitCode: 0,
        stdout: jsonEncode({'nameWithOwner': repository}),
      );
    }
    if (args.take(2).join(' ') == 'pr view') {
      final fields = args.last;
      if (fields == 'headRefOid') {
        final reported = headsOnRecheck.isEmpty
            ? head
            : headsOnRecheck.removeAt(0);
        // A head that moved stays moved.
        head = reported;
        return GhResult(
          exitCode: 0,
          stdout: jsonEncode({'headRefOid': reported}),
        );
      }
      return GhResult(
        exitCode: 0,
        stdout: jsonEncode({
          'number': int.parse(args[2]),
          'state': prState,
          'headRefOid': head,
          'isDraft': false,
          'mergeable': mergeable,
          'mergeStateStatus': mergeStateStatus,
          'url': 'https://github.example/octo/app/pull/${args[2]}',
          'statusCheckRollup': rollup,
        }),
      );
    }
    if (args.take(2).join(' ') == 'pr checks') {
      final answer = required;
      if (answer is GhResult) return answer;
      if (answer == null) {
        return const GhResult(
          exitCode: 1,
          stderr: "no required checks reported on the 'feature' branch",
        );
      }
      return GhResult(
        // gh exits 8 while required checks are pending; the list still
        // prints.
        exitCode: 8,
        stdout: jsonEncode(answer),
      );
    }
    return GhResult(exitCode: 2, stderr: 'unexpected: ${args.join(' ')}');
  }
}
