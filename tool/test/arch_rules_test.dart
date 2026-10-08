import 'package:test/test.dart';

import '../src/arch/arch_rules.dart';

void main() {
  const rules = ArchRules();

  test('one declaration, correctly named, passes', () {
    expect(rules.check('lib/macro_bar.dart', 'class MacroBar {}'), isEmpty);
  });

  test('two declarations fail and name both', () {
    final v = rules.check('lib/widgets.dart', 'class A {}\nclass B {}\n');
    expect(v, hasLength(1));
    expect(v.single.reason, contains('A, B'));
  });

  test('a file named for something else says what to rename it to', () {
    final v = rules.check('lib/util.dart', 'class MacroBar {}');
    expect(v.single.reason, contains('macro_bar.dart'));
  });

  test('a file with no declarations (a barrel) passes', () {
    expect(rules.check('lib/mm.dart', "export 'src/a.dart';"), isEmpty);
  });

  test('a library of top-level functions passes', () {
    expect(
      rules.check('lib/helpers.dart', 'int f() => 1;\nint g() => 2;\n'),
      isEmpty,
    );
  });
}
