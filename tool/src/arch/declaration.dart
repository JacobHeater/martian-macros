import 'declaration_kind.dart';

/// One top-level declaration found in a Dart file.
final class Declaration {
  const Declaration({
    required this.name,
    required this.kind,
    required this.line,
  });

  /// The declared name without a leading underscore, or null for an unnamed
  /// extension.
  final String? name;
  final DeclarationKind kind;

  /// 1-based line.
  final int line;

  @override
  String toString() => name ?? 'extension@$line';
}
