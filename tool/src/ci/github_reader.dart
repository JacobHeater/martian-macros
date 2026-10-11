import 'dart:convert';

import 'check_observation.dart';
import 'gh_failure.dart';
import 'gh_failure_kind.dart';
import 'gh_result.dart';
import 'gh_runner.dart';
import 'normalize_check_state.dart';
import 'pr_snapshot.dart';
import 'required_discovery.dart';

/// Reads a pull request and its checks through `gh`, read-only.
///
/// The pull request, its head commit and that commit's checks come from one
/// answer, so they belong together. The required checks are a second
/// question; the head is asked for again afterwards, and if it moved the
/// whole read is done again, so a snapshot never mixes two commits.
final class GithubReader {
  const GithubReader(this._gh, {this.headRetries = 2});

  final GhRunner _gh;

  /// How many times to start over when the head moves mid-read.
  final int headRetries;

  static const _prFields =
      'number,state,headRefOid,isDraft,mergeable,mergeStateStatus,url,'
      'statusCheckRollup';
  static const _requiredFields = 'name,state,bucket,workflow,link';

  /// The repository `gh` resolves for the working directory, `owner/name`.
  Future<String> currentRepository() async {
    final result = await _gh.run(['repo', 'view', '--json', 'nameWithOwner']);
    if (result.exitCode != 0) throw _failure(result);
    final name = _object(result.stdout)['nameWithOwner'];
    if (name is! String || !name.contains('/')) {
      throw const GhFailure(
        GhFailureKind.other,
        'gh did not name the repository.',
      );
    }
    return name;
  }

  Future<PrSnapshot> read(String repository, int pr, DateTime now) async {
    for (var attempt = 0; attempt <= headRetries; attempt++) {
      final view = await _view(repository, pr, _prFields);
      final head = view['headRefOid'];
      if (head is! String || head.isEmpty) {
        throw const GhFailure(
          GhFailureKind.other,
          'gh did not report a head commit.',
        );
      }
      final checks = _checks(view['statusCheckRollup']);
      final (discovery, required) = await _required(repository, pr);
      // Only a pull request still taking pushes can move.
      if (view['state'] == 'OPEN') {
        final again = await _view(repository, pr, 'headRefOid');
        if (again['headRefOid'] != head) continue;
      }
      return PrSnapshot(
        repository: repository,
        pr: pr,
        headSha: head,
        prState: '${view['state'] ?? 'UNKNOWN'}',
        isDraft: view['isDraft'] == true,
        mergeable: view['mergeable'] as String?,
        mergeStateStatus: view['mergeStateStatus'] as String?,
        url: view['url'] as String?,
        requiredDiscovery: discovery,
        observedAt: now.toUtc().toIso8601String(),
        checks: [
          for (final check in checks)
            required.contains(check.key) ? check.asRequired() : check,
        ],
      );
    }
    throw const GhFailure(
      GhFailureKind.headUnstable,
      'The head commit changed on every attempt to read it.',
    );
  }

  Future<Map<String, Object?>> _view(
    String repository,
    int pr,
    String fields,
  ) async {
    final result = await _gh.run([
      'pr',
      'view',
      '$pr',
      '--repo',
      repository,
      '--json',
      fields,
    ]);
    if (result.exitCode != 0) throw _failure(result);
    return _object(result.stdout);
  }

  /// The keys of the required checks, and whether they could be discovered.
  Future<(RequiredDiscovery, Set<String>)> _required(
    String repository,
    int pr,
  ) async {
    final result = await _gh.run([
      'pr',
      'checks',
      '$pr',
      '--repo',
      repository,
      '--required',
      '--json',
      _requiredFields,
    ]);
    // gh exits non-zero while required checks are pending or failed, and
    // still prints them; so the answer is judged by what it printed.
    try {
      final decoded = jsonDecode(result.stdout.trim());
      if (decoded is List) {
        return (
          RequiredDiscovery.discovered,
          {
            for (final entry in decoded.whereType<Map<String, Object?>>())
              _key(entry['workflow'] as String?, '${entry['name']}'),
          },
        );
      }
    } on FormatException {
      // Not a list of checks; see what it said instead.
    }
    if (result.stderr.contains('no required checks reported')) {
      return (RequiredDiscovery.noneReported, const <String>{});
    }
    final failure = _failure(result);
    // Not being able to tell what is required must not hide that the login
    // or the rate limit is the problem.
    if (failure.kind == GhFailureKind.auth ||
        failure.kind == GhFailureKind.rateLimit) {
      throw failure;
    }
    return (RequiredDiscovery.unknown, const <String>{});
  }

  /// One observation per check. When a check ran more than once for the
  /// commit, the attempt that started last is the one that counts.
  static List<CheckObservation> _checks(Object? rollup) {
    final byKey = <String, CheckObservation>{};
    for (final entry
        in (rollup as List<Object?>? ?? const [])
            .whereType<Map<String, Object?>>()) {
      final CheckObservation check;
      if (entry['__typename'] == 'StatusContext') {
        final name = '${entry['context']}';
        check = CheckObservation(
          key: _key(null, name),
          name: name,
          kind: 'statusContext',
          state: normalizeCheckState(entry['state'] as String?, null),
          providerStatus: entry['state'] as String?,
          url: _text(entry['targetUrl']),
          startedAt: _time(entry['startedAt']),
        );
      } else {
        final name = '${entry['name']}';
        final workflow = _text(entry['workflowName']);
        check = CheckObservation(
          key: _key(workflow, name),
          name: name,
          kind: 'checkRun',
          workflow: workflow,
          state: normalizeCheckState(
            entry['status'] as String?,
            entry['conclusion'] as String?,
          ),
          providerStatus: _text(entry['status']),
          providerConclusion: _text(entry['conclusion']),
          url: _text(entry['detailsUrl']),
          startedAt: _time(entry['startedAt']),
          completedAt: _time(entry['completedAt']),
        );
      }
      final seen = byKey[check.key];
      if (seen == null ||
          (check.startedAt ?? '').compareTo(seen.startedAt ?? '') >= 0) {
        byKey[check.key] = check;
      }
    }
    return byKey.values.toList()..sort((a, b) => a.key.compareTo(b.key));
  }

  static String _key(String? workflow, String name) =>
      workflow == null || workflow.isEmpty ? name : '$workflow / $name';

  static String? _text(Object? value) =>
      value is String && value.isNotEmpty ? value : null;

  /// gh prints year 1 for a time that has not happened.
  static String? _time(Object? value) =>
      value is String && value.isNotEmpty && !value.startsWith('0001-')
      ? value
      : null;

  static Map<String, Object?> _object(String text) {
    try {
      final decoded = jsonDecode(text.trim());
      if (decoded is Map<String, Object?>) return decoded;
    } on FormatException {
      // Fall through.
    }
    throw const GhFailure(
      GhFailureKind.other,
      'gh printed something that is not the JSON asked for.',
    );
  }

  static GhFailure _failure(GhResult result) {
    final said = result.stderr.toLowerCase();
    final kind = said.contains('rate limit')
        ? GhFailureKind.rateLimit
        : said.contains('gh auth login') ||
              said.contains('authentication') ||
              said.contains('http 401') ||
              said.contains('bad credentials')
        ? GhFailureKind.auth
        : said.contains('could not resolve') ||
              said.contains('not found') ||
              said.contains('no pull requests found')
        ? GhFailureKind.notFound
        : GhFailureKind.other;
    return GhFailure(kind, _redact(result.stderr, result.exitCode));
  }

  /// One short line of what gh said, with anything shaped like a token
  /// removed.
  static String _redact(String stderr, int exitCode) {
    final line = stderr
        .split('\n')
        .map((l) => l.trim())
        .firstWhere((l) => l.isNotEmpty, orElse: () => '');
    final safe = line
        .replaceAll(RegExp(r'\b(gh[pousr]_|github_pat_)[A-Za-z0-9_]+'), '***')
        .replaceAll(
          RegExp(
            r'(token|authorization)\S*\s*[:=]\s*\S+',
            caseSensitive: false,
          ),
          '***',
        );
    final short = safe.length > 200 ? '${safe.substring(0, 200)}...' : safe;
    return short.isEmpty ? 'gh exited with code $exitCode.' : short;
  }
}
