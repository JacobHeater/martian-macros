import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/app/martian_macros_app.dart';
import 'package:martian_macros/src/integration_providers.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'in_memory_overrides.dart';

/// Runs the whole app on in-memory repositories and a fixed clock.
Future<void> pumpApp(
  WidgetTester tester,
  InMemoryRepositories repos,
  FixedClock clock,
) async {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 2.5;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        ...inMemoryOverrides(repos),
        clockProvider.overrideWithValue(clock),
      ],
      child: const MartianMacrosApp(),
    ),
  );
  await tester.pumpAndSettle();
}

/// Reads from a repository stream or future. Widget tests run on a fake
/// clock, so such reads must go through `runAsync` or they never complete.
Future<T> readNow<T>(WidgetTester tester, Future<T> Function() read) async =>
    (await tester.runAsync(read)) as T;
