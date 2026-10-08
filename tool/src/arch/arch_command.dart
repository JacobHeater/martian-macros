import 'dart:io';

import 'arch_baseline.dart';
import 'arch_checker.dart';

/// `mm arch`: enforces one declaration per file, with a baseline that only
/// shrinks. `mm arch --init` writes the baseline from the current state and
/// refuses to overwrite one.
Future<int> runArch(Directory repoRoot, List<String> args) async {
  final baselineFile = File('${repoRoot.path}/tool/arch_baseline.txt');
  const checker = ArchChecker();

  if (args.contains('--init')) {
    if (baselineFile.existsSync()) {
      stderr.writeln('${baselineFile.path} exists; the baseline only shrinks.');
      return 1;
    }
    final baseline = ArchBaseline([
      for (final v in checker.violations(repoRoot)) v.path,
    ]);
    baselineFile.writeAsStringSync(baseline.render());
    stdout.writeln('Wrote ${baseline.paths.length} entries.');
    return 0;
  }

  final baseline = baselineFile.existsSync()
      ? ArchBaseline.parse(baselineFile.readAsStringSync())
      : ArchBaseline(const []);
  final report = checker.report(repoRoot, baseline);

  for (final v in report.newViolations) {
    stderr.writeln('  $v');
  }
  for (final path in report.staleBaseline) {
    stderr.writeln(
      '  $path: now follows the rules; remove it from tool/arch_baseline.txt',
    );
  }
  if (!report.passed) {
    final stale = report.staleBaseline.length;
    stderr.writeln(
      '\nmm arch failed: ${report.newViolations.length} new violation(s), '
      '$stale stale baseline entr${stale == 1 ? 'y' : 'ies'}.',
    );
    return 1;
  }
  stdout.writeln(
    'mm arch: ok (${baseline.paths.length} file(s) still in the baseline).',
  );
  return 0;
}
