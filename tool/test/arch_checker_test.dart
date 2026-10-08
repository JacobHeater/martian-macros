import 'dart:io';

import 'package:test/test.dart';

import '../src/arch/arch_baseline.dart';
import '../src/arch/arch_checker.dart';

void main() {
  late Directory root;
  const checker = ArchChecker();

  void write(String path, String content) {
    final file = File('${root.path}/$path')..createSync(recursive: true);
    file.writeAsStringSync(content);
  }

  setUp(() => root = Directory.systemTemp.createTempSync('mm_arch_test'));
  tearDown(() => root.deleteSync(recursive: true));

  test('a new offender outside the baseline fails', () {
    write('packages/a/lib/two.dart', 'class A {}\nclass B {}\n');
    final report = checker.report(root, ArchBaseline(const []));
    expect(report.passed, isFalse);
    expect(report.newViolations.single.path, 'packages/a/lib/two.dart');
  });

  test('a baselined offender passes', () {
    write('packages/a/lib/two.dart', 'class A {}\nclass B {}\n');
    final report = checker.report(
      root,
      ArchBaseline(['packages/a/lib/two.dart']),
    );
    expect(report.passed, isTrue);
  });

  test('a fixed file left in the baseline fails', () {
    write('packages/a/lib/one.dart', 'class One {}\n');
    final report = checker.report(
      root,
      ArchBaseline(['packages/a/lib/one.dart']),
    );
    expect(report.passed, isFalse);
    expect(report.staleBaseline, ['packages/a/lib/one.dart']);
  });

  test('a baseline entry for a deleted file fails', () {
    final report = checker.report(root, ArchBaseline(['packages/gone.dart']));
    expect(report.staleBaseline, ['packages/gone.dart']);
  });

  test('generated files and build output are exempt', () {
    write('packages/a/lib/db.g.dart', 'class A {}\nclass B {}\n');
    write('apps/m/build/x.dart', 'class A {}\nclass B {}\n');
    write(
      'packages/a/test/generated_migrations/s.dart',
      'class A {}\nclass B {}\n',
    );
    expect(checker.report(root, ArchBaseline(const [])).passed, isTrue);
  });

  test('the baseline file round-trips and ignores comments', () {
    final parsed = ArchBaseline.parse('# note\nb.dart\na.dart # x\n\n');
    expect(parsed.paths, {'a.dart', 'b.dart'});
    expect(ArchBaseline.parse(parsed.render()).paths, parsed.paths);
  });
}
