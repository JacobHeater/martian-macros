import 'dart:io';

import 'arch_baseline.dart';
import 'arch_report.dart';
import 'arch_rules.dart';
import 'arch_violation.dart';
import 'source_files.dart';

/// Checks every source file and compares the result with the baseline.
final class ArchChecker {
  const ArchChecker({
    this.rules = const ArchRules(),
    this.files = const SourceFiles(),
  });

  final ArchRules rules;
  final SourceFiles files;

  /// Every violation in the repository, regardless of the baseline.
  List<ArchViolation> violations(Directory repoRoot) => [
    for (final path in files.list(repoRoot))
      ...rules.check(path, File('${repoRoot.path}/$path').readAsStringSync()),
  ];

  ArchReport report(Directory repoRoot, ArchBaseline baseline) {
    final all = violations(repoRoot);
    final violating = {for (final v in all) v.path};
    return ArchReport(
      newViolations: [
        for (final v in all)
          if (!baseline.paths.contains(v.path)) v,
      ],
      staleBaseline: [
        for (final path in baseline.paths)
          if (!violating.contains(path)) path,
      ]..sort(),
    );
  }
}
