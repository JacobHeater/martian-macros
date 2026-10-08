import 'dart:io';

import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

void main() {
  test('the evidence register covers safety and model tuning values', () {
    final register = EvidenceRegister.parse(
      File('../../docs/evidence.md').readAsStringSync(),
    );
    final expected = <String>[
      ..._names(
        'lib/src/safety_bounds.dart',
        'SafetyBounds',
        RegExp(r'\bstatic\s+const(?:\s+\w+)?\s+(\w+)\s*='),
      ),
      ..._names(
        'lib/src/partition.dart',
        '',
        RegExp(r'\bconst\s+(?:double|int|num)\s+(\w+)\s*='),
      ),
      ..._constructorDefaults(
        'lib/src/weight_trend_model.dart',
        'WeightTrendModel',
      ),
      ..._constructorDefaults('lib/src/tdee_estimator.dart', 'TdeeEstimator'),
    ];
    final registeredNames = register.rows.map((row) => row.name).toSet();
    final missing = expected
        .where((name) => !registeredNames.contains(name))
        .toList();

    expect(
      missing,
      isEmpty,
      reason: 'Add an evidence row for each public tuning value.',
    );
    expect(
      register.rows.map((row) => row.name).toSet().length,
      register.rows.length,
      reason: 'Register rows must have unique names.',
    );
    for (final row in register.rows) {
      expect(row.value, isNotEmpty, reason: row.name);
      expect(row.where, isNotEmpty, reason: row.name);
      expect(row.decides, isNotEmpty, reason: row.name);
      expect(row.source, isNotEmpty, reason: row.name);
      expect(row.population, isNotEmpty, reason: row.name);
    }
    for (final question in register.questions) {
      expect(question.answer, isNotEmpty, reason: question.title);
      for (final name in question.rowNames) {
        expect(
          registeredNames,
          contains(name),
          reason: '"${question.title}" references an unknown evidence row.',
        );
      }
    }
  });
}

List<String> _names(String path, String prefix, RegExp declaration) {
  final source = File(path).readAsStringSync();
  return [
    for (final match in declaration.allMatches(source))
      '${prefix.isEmpty ? '' : '$prefix.'}${match.group(1)}',
  ];
}

List<String> _constructorDefaults(String path, String className) {
  final source = File(path).readAsStringSync();
  final defaults = RegExp(r'this\.(\w+)\s*=\s*-?\d+(?:\.\d+)?\b')
      .allMatches(source);
  return [for (final match in defaults) '$className.${match.group(1)}'];
}
