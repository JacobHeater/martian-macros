import 'gh_result.dart';

/// The boundary to GitHub: runs the `gh` CLI with [args]. Tests replace it;
/// nothing else in the watch talks to GitHub.
abstract interface class GhRunner {
  Future<GhResult> run(List<String> args);
}
