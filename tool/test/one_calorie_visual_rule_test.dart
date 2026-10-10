import 'package:test/test.dart';

import '../src/arch/default_identifier_rules.dart';

/// MM-187: the horizon arc, inside the calorie hero, is the only calorie
/// visual. The default rules must stop a screen building its own.
void main() {
  List<String> violations(String path, String source) => [
    for (final rule in defaultIdentifierRules)
      for (final v in rule.check(path, source)) v.reason,
  ];

  test('a screen that builds its own hero surface is stopped', () {
    expect(
      violations(
        'apps/mobile/lib/src/coach/coach_screen.dart',
        'Widget build() => MmHeroSurface(child: Text("2,000"));',
      ),
      isNotEmpty,
    );
  });

  test('a screen that draws the arc itself is stopped', () {
    expect(
      violations(
        'apps/mobile/lib/src/dashboard/dashboard_screen.dart',
        'Widget build() => HorizonArc(progress: 0.5, semanticsLabel: "");',
      ),
      isNotEmpty,
    );
  });

  test('the calorie hero, the design system and the welcome art may', () {
    for (final path in [
      'apps/mobile/lib/src/food/calorie_hero.dart',
      'apps/mobile/lib/src/ui/mm_hero_surface.dart',
      'apps/mobile/lib/src/onboarding/welcome_step.dart',
    ]) {
      expect(violations(path, 'HorizonArc(); MmHeroSurface();'), isEmpty);
    }
  });
}
