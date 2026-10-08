import 'declaration.dart';
import 'declaration_kind.dart';
import 'source_scrubber.dart';

/// Finds the top-level declarations of a Dart source file.
///
/// Not a parser: it removes comments and strings, tracks brace depth, and
/// matches declaration keywords at the start of a depth-0 line. That is exact
/// enough for the formatted code this repository requires.
final class DeclarationScanner {
  const DeclarationScanner({this.scrubber = const SourceScrubber()});

  final SourceScrubber scrubber;

  static const _modifiers =
      r'(?:(?:abstract|sealed|final|base|interface|mixin)\s+)*';
  static final _classLike = RegExp('^\\s*$_modifiers(?:class|enum)\\s+(\\w+)');
  static final _mixin = RegExp(r'^\s*mixin\s+(?!class\b)(\w+)');
  static final _extensionType = RegExp(
    r'^\s*extension\s+type\s+(?:const\s+)?(\w+)',
  );
  static final _extension = RegExp(
    r'^\s*extension\s*(?:(\w+)\s*)?(?:<[^>]*>\s*)?on\b',
  );
  static final _typedef = RegExp(r'^\s*typedef\s+(\w+)');

  List<Declaration> scan(String source) {
    final lines = scrubber.scrub(source).split('\n');
    final found = <Declaration>[];
    var depth = 0;
    for (var index = 0; index < lines.length; index++) {
      final line = lines[index];
      if (depth == 0) {
        final declaration = _match(line, index + 1);
        if (declaration != null) found.add(declaration);
      }
      for (final unit in line.codeUnits) {
        if (unit == 0x7B) depth++;
        if (unit == 0x7D) depth--;
      }
    }
    return found;
  }

  Declaration? _match(String line, int number) {
    Declaration make(String? name, DeclarationKind kind) => Declaration(
      name: name == null
          ? null
          : (name.startsWith('_') ? name.substring(1) : name),
      kind: kind,
      line: number,
    );

    final extensionType = _extensionType.firstMatch(line);
    if (extensionType != null) {
      return make(extensionType.group(1), DeclarationKind.extension);
    }
    final extension = _extension.firstMatch(line);
    if (extension != null) {
      return make(extension.group(1), DeclarationKind.extension);
    }
    final typedef = _typedef.firstMatch(line);
    if (typedef != null) return make(typedef.group(1), DeclarationKind.typedef);
    final classLike = _classLike.firstMatch(line);
    if (classLike != null) {
      return make(classLike.group(1), DeclarationKind.type);
    }
    final mixin = _mixin.firstMatch(line);
    if (mixin != null) return make(mixin.group(1), DeclarationKind.type);
    return null;
  }
}
