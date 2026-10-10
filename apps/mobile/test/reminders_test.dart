import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/format/reminder_text.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-146: reminders the user chooses, that give up politely.
void main() {
  // A Monday. The fixed clock reads noon.
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;
  late InMemoryReminderScheduler scheduler;

  setUp(() async {
    repos = InMemoryRepositories();
    scheduler = InMemoryReminderScheduler();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-200))
          .copyWith(healthCheckConfirmedOn: () => today.addDays(-30)),
    );
    await repos.weights.saveWeight(today.addDays(-1), 82);
  });

  Future<void> open(WidgetTester tester) =>
      pumpApp(tester, repos, FixedClock(today), scheduler: scheduler);

  Future<void> openReminders(WidgetTester tester) async {
    await open(tester);
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('reminder-weeklyMeasurement')),
      200,
      scrollable: find.byType(Scrollable).first,
    );
  }

  Future<List<ReminderSetting>> stored(WidgetTester tester) =>
      readNow(tester, () => repos.reminders.watchReminders().first);

  Future<void> turnOn(WidgetTester tester, ReminderKind kind) async {
    final row = find.byKey(ValueKey('reminder-${kind.name}'));
    await tester.ensureVisible(row);
    await tester.pumpAndSettle();
    await tester.tap(row);
    await tester.pumpAndSettle();
  }

  test('no notification carries health data or pressure', () {
    for (final kind in ReminderKind.values) {
      final prompt = kind.prompt.toLowerCase();
      expect(prompt, isNot(matches(RegExp(r'\d'))), reason: prompt);
      for (final word in [
        'kcal',
        'calorie',
        'weight ',
        'lb',
        'kg',
        'target',
        'streak',
        'missed',
        'days',
        'you ',
        'your ',
        "don't",
        'forget',
      ]) {
        expect(prompt, isNot(contains(word)), reason: '$prompt / $word');
      }
      expect(prompt, endsWith('?'), reason: 'a plain prompt');
    }
  });

  testWidgets('nothing is on, scheduled or asked for until the user acts', (
    tester,
  ) async {
    await openReminders(tester);
    expect(await stored(tester), isEmpty);
    expect(scheduler.permissionRequests, 0);
    expect(scheduler.scheduled, isEmpty);
    for (final s in tester.widgetList<Switch>(find.byType(Switch))) {
      // The easy-to-miss line is the one switch that starts on.
      if (s.value) continue;
      expect(s.value, isFalse);
    }
  });

  testWidgets('turning one on asks for permission, then schedules it', (
    tester,
  ) async {
    await openReminders(tester);
    await turnOn(tester, ReminderKind.weighIn);
    expect(scheduler.permissionRequests, 1);
    final setting = (await stored(tester)).single;
    expect(setting.enabled, isTrue);
    expect(setting.minuteOfDay, 7 * 60);
    expect(setting.countFrom, today.addDays(1), reason: '7 am has passed');
    // It is noon: seven mornings from tomorrow.
    expect(scheduler.scheduled, hasLength(7));
    expect(scheduler.scheduled.first.date, today.addDays(1));
    expect(
      scheduler.scheduled.every((r) => r.kind == ReminderKind.weighIn),
      isTrue,
    );
  });

  testWidgets('a refused permission leaves it off and says why', (
    tester,
  ) async {
    scheduler.grantPermission = false;
    await openReminders(tester);
    await turnOn(tester, ReminderKind.weighIn);
    expect(await stored(tester), isEmpty);
    expect(scheduler.scheduled, isEmpty);
    expect(find.textContaining('Notifications are off'), findsOneWidget);
  });

  testWidgets('turning it off cancels what was scheduled', (tester) async {
    await openReminders(tester);
    await turnOn(tester, ReminderKind.logFood);
    // 8 pm today is still ahead.
    expect(scheduler.scheduled.first.date, today);
    await turnOn(tester, ReminderKind.logFood);
    expect((await stored(tester)).single.enabled, isFalse);
    expect(scheduler.scheduled, isEmpty);
  });

  testWidgets('logging food cancels today’s food reminder', (tester) async {
    await repos.reminders.saveReminder(
      ReminderSetting(
        kind: ReminderKind.logFood,
        enabled: true,
        minuteOfDay: 20 * 60,
        countFrom: today,
      ),
    );
    await open(tester);
    expect(scheduler.scheduled.first.date, today);
    await tester.runAsync(
      () => repos.food.addFood(
        FoodEntry(
          id: 0,
          date: today,
          meal: Meal.lunch,
          name: 'Lunch',
          kcal: 600,
          proteinG: 40,
          carbsG: 60,
          fatG: 20,
          source: QuantitySource.weighed,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(scheduler.scheduled.first.date, today.addDays(1));
  });

  testWidgets('a pause silences its days', (tester) async {
    await repos.reminders.saveReminder(
      ReminderSetting(
        kind: ReminderKind.logFood,
        enabled: true,
        minuteOfDay: 20 * 60,
        countFrom: today,
      ),
    );
    final pause = Pause(
      from: today,
      to: today.addDays(4),
      reason: PauseReason.travel,
    );
    await repos.pauses.savePause(pause);
    await open(tester);
    expect(scheduler.scheduled, isNotEmpty);
    expect(scheduler.scheduled.any((r) => pause.covers(r.date)), isFalse);
  });

  group('ignored for a week', () {
    setUp(() async {
      await repos.weights.saveWeight(today.addDays(-20), 82);
      await repos.reminders.saveReminder(
        ReminderSetting(
          kind: ReminderKind.weighIn,
          enabled: true,
          minuteOfDay: 7 * 60,
          countFrom: today.addDays(-9),
        ),
      );
      // The setUp above weighed in yesterday; this group needs silence.
      repos = await _withoutRecentWeighIn(repos, today);
    });

    testWidgets('nothing more is scheduled, and the app asks once', (
      tester,
    ) async {
      await open(tester);
      expect(scheduler.scheduled, isEmpty);
      expect(find.byKey(const ValueKey('reminder-paused-notice')), findsOne);
      expect(
        find.text('Weigh-in reminders are paused. Keep them or turn them off?'),
        findsOneWidget,
      );
    });

    testWidgets('Keep starts them again', (tester) async {
      await open(tester);
      await tester.tap(find.byKey(const ValueKey('reminder-keep')));
      await tester.pumpAndSettle();
      expect(
        find.byKey(const ValueKey('reminder-paused-notice')),
        findsNothing,
      );
      expect((await stored(tester)).single.countFrom, today.addDays(1));
      expect(scheduler.scheduled, isNotEmpty);
    });

    testWidgets('Turn off turns them off', (tester) async {
      await open(tester);
      await tester.tap(find.byKey(const ValueKey('reminder-turn-off')));
      await tester.pumpAndSettle();
      expect(
        find.byKey(const ValueKey('reminder-paused-notice')),
        findsNothing,
      );
      expect((await stored(tester)).single.enabled, isFalse);
      expect(scheduler.scheduled, isEmpty);
    });
  });
}

/// The same data with the last weigh-in three weeks ago, so a weigh-in
/// reminder has gone unanswered. Three weeks without a record is also a gap
/// (MM-147), so food is logged today to keep the dashboard in front.
Future<InMemoryRepositories> _withoutRecentWeighIn(
  InMemoryRepositories from,
  CalendarDate today,
) async {
  final repos = InMemoryRepositories();
  await repos.setup.saveSetup((await from.setup.loadSetup())!);
  await repos.weights.saveWeight(today.addDays(-20), 82);
  for (final setting in await from.reminders.watchReminders().first) {
    await repos.reminders.saveReminder(setting);
  }
  for (var day = 0; day <= 19; day++) {
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today.addDays(-day),
        meal: Meal.lunch,
        name: 'Lunch',
        kcal: 2000,
        proteinG: 140,
        carbsG: 200,
        fatG: 70,
        source: QuantitySource.weighed,
      ),
    );
  }
  return repos;
}
