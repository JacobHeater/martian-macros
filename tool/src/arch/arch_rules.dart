import 'arch_violation.dart';
import 'declaration_scanner.dart';
import 'default_identifier_rules.dart';
import 'default_import_rules.dart';
import 'forbidden_identifier_rule.dart';
import 'forbidden_import_rule.dart';
import 'snake_case.dart';

/// The file-level rules: one declaration per file, the file is named for what
/// it declares, layering imports are respected, and screens use design-system
/// components rather than raw Material controls.
final class ArchRules {
  const ArchRules({
    this.scanner = const DeclarationScanner(),
    this.snakeCase = const SnakeCase(),
    this.importRules = defaultImportRules,
    this.identifierRules = defaultIdentifierRules,
  });

  final DeclarationScanner scanner;
  final SnakeCase snakeCase;
  final List<ForbiddenImportRule> importRules;
  final List<ForbiddenIdentifierRule> identifierRules;

  /// Violations in one file. [path] is repo-relative with `/` separators.
  List<ArchViolation> check(String path, String source) => [
    ..._declarationViolations(path, source),
    for (final rule in importRules) ...rule.check(path, source),
    for (final rule in identifierRules) ...rule.check(path, source),
  ];

  List<ArchViolation> _declarationViolations(String path, String source) {
    final declarations = scanner.scan(source);
    if (declarations.length > 1) {
      return [
        ArchViolation(
          path: path,
          reason:
              'declares ${declarations.length} types '
              '(${declarations.join(', ')}); one declaration per file',
        ),
      ];
    }
    if (declarations.length == 1) {
      final name = declarations.single.name;
      if (name != null) {
        final expected = '${snakeCase.of(name)}.dart';
        final actual = path.substring(path.lastIndexOf('/') + 1);
        if (actual != expected) {
          return [
            ArchViolation(
              path: path,
              reason: 'declares $name, so the file should be named $expected',
            ),
          ];
        }
      }
    }
    return const [];
  }
}
