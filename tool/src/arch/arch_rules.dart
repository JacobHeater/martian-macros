import 'arch_violation.dart';
import 'declaration_scanner.dart';
import 'snake_case.dart';

/// The file-level rules: one declaration per file, and the file is named for
/// what it declares.
final class ArchRules {
  const ArchRules({
    this.scanner = const DeclarationScanner(),
    this.snakeCase = const SnakeCase(),
  });

  final DeclarationScanner scanner;
  final SnakeCase snakeCase;

  /// Violations in one file. [path] is repo-relative with `/` separators.
  List<ArchViolation> check(String path, String source) {
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
