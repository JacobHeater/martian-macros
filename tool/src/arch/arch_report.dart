import 'arch_violation.dart';

/// The outcome of checking the repository against its baseline.
final class ArchReport {
  const ArchReport({required this.newViolations, required this.staleBaseline});

  /// Violations in files that are not in the baseline.
  final List<ArchViolation> newViolations;

  /// Baseline entries that no longer violate anything (or no longer exist).
  final List<String> staleBaseline;

  bool get passed => newViolations.isEmpty && staleBaseline.isEmpty;
}
