import 'arch_violation.dart';

/// Files under [appliesTo] may not import anything starting with one of
/// [forbidden], except the [allowedFiles].
final class ForbiddenImportRule {
  const ForbiddenImportRule({
    required this.appliesTo,
    required this.forbidden,
    required this.reason,
    this.allowedFiles = const [],
  });

  /// Repo-relative path prefix, with `/`.
  final String appliesTo;

  /// Import prefixes, such as `package:drift`.
  final List<String> forbidden;
  final String reason;
  final List<String> allowedFiles;

  static final _import = RegExp(
    r'''^\s*(?:import|export)\s+['"]([^'"]+)['"]''',
    multiLine: true,
  );

  List<ArchViolation> check(String path, String source) {
    if (!path.startsWith(appliesTo) || allowedFiles.contains(path)) {
      return const [];
    }
    final violations = <ArchViolation>[];
    for (final match in _import.allMatches(source)) {
      final uri = match.group(1)!;
      if (forbidden.any(uri.startsWith)) {
        violations.add(
          ArchViolation(path: path, reason: 'imports $uri; $reason'),
        );
      }
    }
    return violations;
  }
}
