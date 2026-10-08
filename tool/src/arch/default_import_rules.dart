import 'forbidden_import_rule.dart';

/// Layering and dependency-inversion rules (MM-159, MM-161, MM-162).
const defaultImportRules = <ForbiddenImportRule>[
  ForbiddenImportRule(
    appliesTo: 'apps/mobile/lib/',
    forbidden: [
      'package:drift',
      'package:drift_flutter',
      'package:mm_data',
      'package:mm_fixtures',
    ],
    reason:
        'the app depends on repository interfaces, never on a database; only '
        'repository_providers.dart chooses an implementation',
    allowedFiles: ['apps/mobile/lib/src/repository_providers.dart'],
  ),
  ForbiddenImportRule(
    appliesTo: 'packages/domain/lib/',
    forbidden: [
      'package:flutter',
      'package:drift',
      'package:mm_data',
      'package:mm_engine',
    ],
    reason: 'domain is pure Dart and the lowest layer',
  ),
  ForbiddenImportRule(
    appliesTo: 'packages/engine/lib/',
    forbidden: ['package:flutter', 'package:drift', 'package:mm_data'],
    reason: 'the engine is pure Dart and knows nothing of persistence',
  ),
  ForbiddenImportRule(
    appliesTo: 'packages/data/lib/',
    forbidden: ['package:flutter', 'package:mm_fixtures'],
    reason: 'persistence is pure Dart and does not depend on test fixtures',
  ),
];
