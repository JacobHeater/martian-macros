import 'package:test/test.dart';

import '../src/arch/arch_rules.dart';
import '../src/arch/forbidden_import_rule.dart';

void main() {
  const rule = ForbiddenImportRule(
    appliesTo: 'apps/mobile/lib/',
    forbidden: ['package:drift', 'package:mm_data'],
    reason: 'use a repository',
    allowedFiles: ['apps/mobile/lib/src/registration.dart'],
  );

  test('a forbidden import in a covered file is reported with the reason', () {
    final v = rule.check(
      'apps/mobile/lib/src/screen.dart',
      "import 'package:mm_data/mm_data.dart';\n",
    );
    expect(v.single.reason, contains('package:mm_data/mm_data.dart'));
    expect(v.single.reason, contains('use a repository'));
  });

  test('exports count too', () {
    final v = rule.check(
      'apps/mobile/lib/a.dart',
      "export 'package:drift/drift.dart';\n",
    );
    expect(v, hasLength(1));
  });

  test('the allowed file may import it', () {
    final v = rule.check(
      'apps/mobile/lib/src/registration.dart',
      "import 'package:drift/drift.dart';\n",
    );
    expect(v, isEmpty);
  });

  test('files outside the covered path are not checked', () {
    final v = rule.check(
      'packages/data/lib/a.dart',
      "import 'package:drift/drift.dart';\n",
    );
    expect(v, isEmpty);
  });

  test('allowed imports pass', () {
    final v = rule.check(
      'apps/mobile/lib/a.dart',
      "import 'package:mm_domain/mm_domain.dart';\n",
    );
    expect(v, isEmpty);
  });

  test('the default rules protect the layers', () {
    const rules = ArchRules();
    expect(
      rules.check(
        'packages/domain/lib/src/a.dart',
        "import 'package:flutter/material.dart';\n",
      ),
      isNotEmpty,
    );
    expect(
      rules.check(
        'apps/mobile/lib/src/repository_providers.dart',
        "import 'package:mm_data/mm_data.dart';\n",
      ),
      isEmpty,
    );
  });
}
