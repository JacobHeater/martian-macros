import 'package:test/test.dart';

import '../src/arch/default_identifier_rules.dart';

/// MM-190: the time comes from the app's Clock. Code that read the device's
/// time made six Food tests pass or fail by the hour they ran.
void main() {
  List<String> violations(String path, String source) => [
    for (final rule in defaultIdentifierRules)
      for (final v in rule.check(path, source)) v.reason,
  ];

  test('a screen that reads the device time is stopped', () {
    expect(
      violations(
        'apps/mobile/lib/src/food/add_food_sheet_state.dart',
        'final hour = DateTime.now().hour;',
      ),
      isNotEmpty,
    );
  });

  test('a package that reads the device time is stopped', () {
    expect(
      violations(
        'packages/engine/lib/src/plan_reminders.dart',
        'final now = DateTime.now();',
      ),
      isNotEmpty,
    );
  });

  test('the system clock is the one place that may', () {
    expect(
      violations(
        'packages/domain/lib/src/integration/system_clock.dart',
        'DateTime now() => DateTime.now();',
      ),
      isEmpty,
    );
  });

  test('other uses of DateTime are not stopped', () {
    expect(
      violations(
        'apps/mobile/lib/src/food/add_food_sheet_state.dart',
        'final noon = DateTime(2026, 10, 5, 12); clock.now();',
      ),
      isEmpty,
    );
  });
}
