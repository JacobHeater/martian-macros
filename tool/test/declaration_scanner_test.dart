import 'package:test/test.dart';

import '../src/arch/declaration_scanner.dart';

void main() {
  const scanner = DeclarationScanner();
  List<String> names(String source) => [
    for (final d in scanner.scan(source)) d.toString(),
  ];

  test('finds classes with modifiers, enums, mixins, extensions, typedefs', () {
    const source = '''
abstract interface class WeightReader {}
final class MmStore {}
sealed class Result {}
enum Meal { breakfast }
mixin Loggable {}
extension GoalLabel on int {}
typedef Callback = void Function();
''';
    expect(names(source), [
      'WeightReader',
      'MmStore',
      'Result',
      'Meal',
      'Loggable',
      'GoalLabel',
      'Callback',
    ]);
  });

  test('ignores nested and commented declarations', () {
    const source = '''
class Outer {
  class NotReal {}
}
// class Commented {}
/* class Block {} */
''';
    expect(names(source), ['Outer']);
  });

  test('ignores keywords inside strings, including interpolation', () {
    const source = r"""
class A {
  final s = 'class B {} ${ 'class C {' } }';
  final t = '''
class D {}
''';
  final raw = r'class E {';
}
""";
    expect(names(source), ['A']);
  });

  test('keeps depth correct across braces in strings', () {
    const source = r'''
class A {
  final s = '{{{';
}
class B {}
''';
    expect(names(source), ['A', 'B']);
  });

  test(
    'a private name drops its underscore; an unnamed extension is allowed',
    () {
      final found = scanner.scan('class _Hidden {}\nextension on int {}\n');
      expect(found.first.name, 'Hidden');
      expect(found.last.name, isNull);
    },
  );

  test('a barrel declares nothing', () {
    expect(names("export 'a.dart';\nexport 'b.dart';\n"), isEmpty);
  });

  test('reports line numbers', () {
    expect(scanner.scan('\n\nclass A {}\n').single.line, 3);
  });
}
