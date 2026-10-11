import 'dart:convert';
import 'dart:io';

import 'gh_result.dart';
import 'gh_runner.dart';

/// [GhRunner] over the installed `gh`, using its own stored login. Arguments
/// are passed as a list, never through a shell, so nothing read from GitHub
/// can be interpreted as a command.
final class ProcessGhRunner implements GhRunner {
  const ProcessGhRunner({this.timeout = const Duration(seconds: 30)});

  final Duration timeout;

  @override
  Future<GhResult> run(List<String> args) async {
    try {
      final result = await Process.run(
        'gh',
        args,
        stdoutEncoding: const Utf8Codec(allowMalformed: true),
        stderrEncoding: const Utf8Codec(allowMalformed: true),
        // Never prompt: a watch has nobody to answer.
        environment: const {'GH_PROMPT_DISABLED': '1', 'NO_COLOR': '1'},
      ).timeout(timeout);
      return GhResult(
        exitCode: result.exitCode,
        stdout: result.stdout as String,
        stderr: result.stderr as String,
      );
    } on ProcessException catch (e) {
      return GhResult(
        exitCode: 127,
        stderr: 'gh could not be run: ${e.message}',
      );
    } on Exception {
      return const GhResult(exitCode: 124, stderr: 'gh timed out');
    }
  }
}
