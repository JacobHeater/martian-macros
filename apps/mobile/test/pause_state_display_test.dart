import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/dashboard/dashboard_screen.dart';
import 'package:martian_macros/src/food/calorie_hero.dart';
import 'package:martian_macros/src/food/food_screen.dart';
import 'package:martian_macros/src/providers.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/in_memory_overrides.dart';

void main() {
  final today = CalendarDate(2026, 10, 10);
  for (final dashboard in [true, false]) {
    for (final failed in [false, true]) {
      testWidgets(
        'MM-183: target display waits for pauses ($dashboard, $failed)',
        (tester) async {
          final repos = InMemoryRepositories();
          await repos.setup.saveSetup(
            typicalSetup(onboardedOn: today.addDays(-30)),
          );
          await tester.pumpWidget(
            ProviderScope(
              overrides: [
                ...inMemoryOverrides(repos),
                todayProvider.overrideWithValue(today),
                pausesProvider.overrideWith(
                  (ref) => failed
                      ? Stream<List<Pause>>.error(
                          StateError('pause unavailable'),
                        )
                      : const Stream<List<Pause>>.empty(),
                ),
              ],
              child: MaterialApp(
                theme: mmTheme(Brightness.light),
                home: Scaffold(
                  body: dashboard
                      ? const DashboardScreen()
                      : const FoodScreen(),
                ),
              ),
            ),
          );
          await tester.pumpAndSettle();
          expect(find.byType(CalorieHero), findsNothing);
          expect(
            find.text(
              failed
                  ? 'Pause history could not be loaded. Reopen the app to retry.'
                  : 'Loading pause history…',
            ),
            findsOneWidget,
          );
        },
      );
    }
  }
}
