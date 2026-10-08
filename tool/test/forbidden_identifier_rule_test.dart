import 'package:test/test.dart';

import '../src/arch/arch_rules.dart';
import '../src/arch/forbidden_identifier_rule.dart';

void main() {
  const rule = ForbiddenIdentifierRule(
    appliesTo: 'apps/mobile/lib/',
    identifiers: ['FilledButton', 'Card', 'Switch'],
    reason: 'use a component',
    allowedPrefixes: ['apps/mobile/lib/src/ui/'],
  );

  test('a raw control in a screen is reported with the control named', () {
    final v = rule.check(
      'apps/mobile/lib/src/today/today_screen.dart',
      'Widget build() => FilledButton(onPressed: null, child: Text(""));',
    );
    expect(v.single.reason, contains('FilledButton'));
    expect(v.single.reason, contains('use a component'));
  });

  test('each control is reported once per file, sorted', () {
    final v = rule.check(
      'apps/mobile/lib/a.dart',
      'Card(); Card(); FilledButton.icon();',
    );
    expect(v.map((x) => x.reason.split(';').first), [
      'uses Card',
      'uses FilledButton',
    ]);
  });

  test('the component folder may use them', () {
    expect(
      rule.check('apps/mobile/lib/src/ui/mm_button.dart', 'FilledButton();'),
      isEmpty,
    );
  });

  test('comments and strings are ignored', () {
    expect(
      rule.check(
        'apps/mobile/lib/a.dart',
        "// Card is a control\nfinal s = 'Switch on the FilledButton';\n",
      ),
      isEmpty,
    );
  });

  test('longer names are not mistaken for the control', () {
    expect(
      rule.check('apps/mobile/lib/a.dart', 'CardTheme(); SwitchThemeData();'),
      isEmpty,
    );
  });

  test('files outside the covered path are not checked', () {
    expect(rule.check('packages/x/lib/a.dart', 'Card();'), isEmpty);
  });

  test('the default rules cover the app', () {
    const rules = ArchRules();
    expect(
      rules.check('apps/mobile/lib/src/today/x.dart', 'TextField();'),
      isNotEmpty,
    );
  });
}
