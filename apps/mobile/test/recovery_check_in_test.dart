import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-116: twenty seconds a week on how the user is holding up.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-200))
          .copyWith(healthCheckConfirmedOn: () => today.addDays(-30)),
    );
    await repos.weights.saveWeight(today, 82);
  });

  RecoveryCheckIn answered(int daysAgo, {int hunger = 3}) => RecoveryCheckIn(
    date: today.addDays(-daysAgo),
    hunger: hunger,
    energy: 2,
    sleep: 4,
    training: 3,
    mood: 5,
  );

  Future<void> openCoach(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Coach'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('recovery-answer')),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.ensureVisible(find.byKey(const ValueKey('recovery-answer')));
    await tester.pumpAndSettle();
  }

  Future<List<RecoveryCheckIn>> stored(WidgetTester tester) =>
      readNow(tester, () => repos.recovery.watchRecoveryCheckIns().first);

  Future<void> pick(
    WidgetTester tester,
    RecoveryQuestion question,
    int value,
  ) async {
    final control = find.byKey(ValueKey('recovery-${question.name}'));
    await tester.ensureVisible(control);
    await tester.pumpAndSettle();
    await tester.tap(
      find.descendant(of: control, matching: find.text('$value')),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('answering stores one record and shows the five lines', (
    tester,
  ) async {
    await openCoach(tester);
    expect(find.text('Answer this week'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('recovery-answer')));
    await tester.pumpAndSettle();

    final answers = {
      RecoveryQuestion.hunger: 2,
      RecoveryQuestion.energy: 3,
      RecoveryQuestion.sleep: 1,
      RecoveryQuestion.training: 4,
      RecoveryQuestion.mood: 5,
    };
    for (final entry in answers.entries) {
      await pick(tester, entry.key, entry.value);
    }
    final hours = find.byKey(const ValueKey('recovery-sleep-hours'));
    await tester.ensureVisible(hours);
    await tester.enterText(hours, '6.5');
    final save = find.byKey(const ValueKey('recovery-save'));
    await tester.ensureVisible(save);
    await tester.pumpAndSettle();
    await tester.tap(save);
    await tester.pumpAndSettle();

    final saved = (await stored(tester)).single;
    expect(saved.date, today);
    for (final entry in answers.entries) {
      expect(saved.answer(entry.key), entry.value);
    }
    expect(saved.sleepHours, 6.5);

    // Back on the Coach screen: a line per question, and no offer this week.
    expect(find.text('Hunger'), findsOneWidget);
    expect(find.text('2 of 5'), findsOneWidget);
    expect(find.text('Mood'), findsOneWidget);
    expect(find.text('Answer this week'), findsNothing);
    expect(find.byKey(const ValueKey('recovery-skip')), findsNothing);
  });

  testWidgets('it cannot be saved until all five are answered', (tester) async {
    await openCoach(tester);
    await tester.tap(find.byKey(const ValueKey('recovery-answer')));
    await tester.pumpAndSettle();
    for (final question in RecoveryQuestion.values.take(4)) {
      await pick(tester, question, 3);
    }
    final save = find.byKey(const ValueKey('recovery-save'));
    await tester.ensureVisible(save);
    await tester.pumpAndSettle();
    await tester.tap(save);
    await tester.pumpAndSettle();
    expect(await stored(tester), isEmpty);
  });

  testWidgets('skipping stores no answers and is not asked again this week', (
    tester,
  ) async {
    await openCoach(tester);
    await tester.tap(find.byKey(const ValueKey('recovery-skip')));
    await tester.pumpAndSettle();
    expect(await stored(tester), isEmpty);
    expect(find.text('Answer this week'), findsNothing);
    expect(find.byKey(const ValueKey('recovery-skip')), findsNothing);
  });

  testWidgets('a skipped week is offered again the week after', (tester) async {
    await repos.preferences.saveRecoveryCheckInSkippedOn(today.addDays(-7));
    await openCoach(tester);
    expect(find.text('Answer this week'), findsOneWidget);
  });

  testWidgets('no screen combines the answers into one number or grade', (
    tester,
  ) async {
    for (var week = 0; week < 3; week++) {
      await repos.recovery.saveRecoveryCheckIn(
        answered(week * 7 + 1, hunger: week + 1),
      );
    }
    await openCoach(tester);
    final all = tester
        .widgetList<Text>(
          find.descendant(
            of: find.byKey(const ValueKey('recovery-card')),
            matching: find.byType(Text),
          ),
        )
        .map((t) => t.data ?? '')
        .join(' ')
        .toLowerCase();
    for (final word in ['score', 'grade', 'overall', 'total', 'average']) {
      expect(all, isNot(contains(word)), reason: word);
    }
    // One figure per question and nothing that sums them.
    expect(find.textContaining(' of 5'), findsNWidgets(5));
  });

  testWidgets('in the first week it can be answered but is not asked for', (
    tester,
  ) async {
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-3))
          .copyWith(healthCheckConfirmedOn: () => today.addDays(-3)),
    );
    await openCoach(tester);
    expect(find.text('Answer now'), findsOneWidget);
    expect(find.text('Answer again'), findsNothing);
    expect(find.byKey(const ValueKey('recovery-skip')), findsNothing);
  });

  testWidgets('it is not offered during a pause', (tester) async {
    await repos.pauses.savePause(
      Pause(
        from: today.addDays(-1),
        to: today.addDays(5),
        reason: PauseReason.travel,
      ),
    );
    await openCoach(tester);
    expect(find.text('Answer this week'), findsNothing);
    expect(find.byKey(const ValueKey('recovery-skip')), findsNothing);
  });
}
