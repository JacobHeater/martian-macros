import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-146: reminders the user chooses, that give up politely.
void main() {
  // A Monday, so the first Sunday ahead is six days on.
  final today = CalendarDate(2026, 10, 5);
  const sevenAm = 7 * 60;
  const eightPm = 20 * 60;

  ReminderSetting on(
    ReminderKind kind, {
    int? minute,
    int since = 0,
    bool enabled = true,
  }) => ReminderSetting(
    kind: kind,
    enabled: enabled,
    minuteOfDay: minute ?? ReminderRule.defaultMinuteOfDay(kind),
    countFrom: today.addDays(-since),
  );

  List<PlannedReminder> plan(
    List<ReminderSetting> settings, {
    ReminderFacts? facts,
    int minuteNow = 6 * 60,
  }) => planReminders(
    settings: settings,
    facts: facts ?? ReminderFacts(),
    today: today,
    minuteNow: minuteNow,
  );

  test('nothing is on by default, so nothing is planned', () {
    expect(plan(const []), isEmpty);
    expect(
      plan([for (final kind in ReminderKind.values) on(kind, enabled: false)]),
      isEmpty,
    );
  });

  test('the defaults are 7 am, 8 pm and Sunday 8 am', () {
    expect(ReminderRule.defaultMinuteOfDay(ReminderKind.weighIn), sevenAm);
    expect(ReminderRule.defaultMinuteOfDay(ReminderKind.logFood), eightPm);
    final weekly = plan([on(ReminderKind.weeklyMeasurement)]);
    expect(weekly.first.date, CalendarDate(2026, 10, 11));
    expect(weekly.first.minuteOfDay, 8 * 60);
    expect(
      weekly.every((r) => today.daysUntil(r.date) % 7 == 6),
      isTrue,
      reason: 'Sundays only',
    );
  });

  group('a weigh-in reminder', () {
    test('is planned for 7 am today when there is no weigh-in yet', () {
      final planned = plan([on(ReminderKind.weighIn)]);
      expect(
        planned.first,
        PlannedReminder(
          kind: ReminderKind.weighIn,
          date: today,
          minuteOfDay: sevenAm,
        ),
      );
    });

    test('is not sent today after a weigh-in at 6:40', () {
      final planned = plan(
        [on(ReminderKind.weighIn)],
        facts: ReminderFacts(weighInDays: [today]),
        minuteNow: 6 * 60 + 40,
      );
      expect(planned.any((r) => r.date == today), isFalse);
      expect(planned.first.date, today.addDays(1));
    });

    test('is not planned for today once its time has passed', () {
      final planned = plan([on(ReminderKind.weighIn)], minuteNow: 9 * 60);
      expect(planned.first.date, today.addDays(1));
    });
  });

  group('a reminder that is ignored', () {
    test('has seven sends and then stops', () {
      expect(plan([on(ReminderKind.weighIn)]), hasLength(7));
    });

    test('is not sent on the eighth day', () {
      final setting = on(ReminderKind.weighIn, since: 7);
      expect(
        reminderIgnoredStreak(
          setting: setting,
          facts: ReminderFacts(),
          today: today,
          minuteNow: 6 * 60,
        ),
        7,
      );
      expect(plan([setting]), isEmpty);
    });

    test('a user away for 30 days has heard nothing since it stopped', () {
      final setting = on(ReminderKind.weighIn, since: 30);
      expect(plan([setting]), isEmpty);
      expect(plan([setting, on(ReminderKind.logFood, since: 30)]), isEmpty);
    });

    test('each send that goes unanswered shortens what is planned', () {
      expect(plan([on(ReminderKind.weighIn, since: 3)]), hasLength(4));
    });

    test('doing the thing starts the count again', () {
      final setting = on(ReminderKind.weighIn, since: 30);
      final facts = ReminderFacts(weighInDays: [today.addDays(-1)]);
      expect(
        reminderIgnoredStreak(
          setting: setting,
          facts: facts,
          today: today,
          minuteNow: 6 * 60,
        ),
        0,
      );
      expect(plan([setting], facts: facts), hasLength(7));
    });

    test('keeping it starts the count again from that day', () {
      final kept = on(
        ReminderKind.weighIn,
        since: 30,
      ).copyWith(countFrom: today);
      expect(plan([kept]), hasLength(7));
    });

    test('a weekly one stops after seven Sundays', () {
      expect(plan([on(ReminderKind.weeklyMeasurement)]), hasLength(7));
      expect(plan([on(ReminderKind.weeklyMeasurement, since: 50)]), isEmpty);
    });
  });

  test('the weekly measurement is skipped when the waist was measured', () {
    final planned = plan([
      on(ReminderKind.weeklyMeasurement),
    ], facts: ReminderFacts(waistDays: [CalendarDate(2026, 10, 8)]));
    // Measured on Thursday: that still counts on Sunday the 11th, so the
    // first reminder is the Sunday after.
    expect(planned.first.date, CalendarDate(2026, 10, 18));
  });

  test('at most two a day, and the weekly one is kept', () {
    final planned = plan([
      on(ReminderKind.weighIn),
      on(ReminderKind.logFood),
      on(ReminderKind.weeklyMeasurement),
    ]);
    final perDay = <CalendarDate, int>{};
    for (final r in planned) {
      perDay[r.date] = (perDay[r.date] ?? 0) + 1;
    }
    expect(perDay.values.every((n) => n <= ReminderRule.dailyCap), isTrue);
    final sunday = planned.where((r) => r.date == CalendarDate(2026, 10, 11));
    expect(sunday.map((r) => r.kind), [
      ReminderKind.weighIn,
      ReminderKind.weeklyMeasurement,
    ]);
  });

  test('nothing is sent in the quiet period', () {
    expect(plan([on(ReminderKind.weighIn, minute: 6 * 60 + 30)]), isEmpty);
    expect(plan([on(ReminderKind.logFood, minute: 21 * 60)]), isEmpty);
    expect(plan([on(ReminderKind.logFood, minute: 20 * 60 + 59)]), isNotEmpty);
  });

  test('a pause silences everything for its days', () {
    final pause = Pause(
      from: today.addDays(1),
      to: today.addDays(4),
      reason: PauseReason.travel,
    );
    final planned = plan([
      on(ReminderKind.weighIn),
      on(ReminderKind.logFood),
    ], facts: ReminderFacts(pauses: [pause]));
    expect(planned.any((r) => pause.covers(r.date)), isFalse);
    expect(planned.any((r) => r.date == today), isTrue);
  });

  test('paused days do not count as ignored', () {
    final pause = Pause(
      from: today.addDays(-10),
      to: today.addDays(-1),
      reason: PauseReason.illness,
    );
    expect(
      reminderIgnoredStreak(
        setting: on(ReminderKind.weighIn, since: 12),
        facts: ReminderFacts(pauses: [pause]),
        today: today,
        minuteNow: 6 * 60,
      ),
      2,
    );
  });

  test('turned on after its time, today does not count as ignored', () {
    expect(
      reminderCountFrom(today: today, minuteNow: 720, minuteOfDay: sevenAm),
      today.addDays(1),
    );
    expect(
      reminderCountFrom(today: today, minuteNow: 360, minuteOfDay: sevenAm),
      today,
    );
  });

  test('the plan is in time order', () {
    final planned = plan([on(ReminderKind.logFood), on(ReminderKind.weighIn)]);
    for (var i = 1; i < planned.length; i++) {
      final a = planned[i - 1], b = planned[i];
      expect(
        a.date.isBefore(b.date) ||
            (a.date == b.date && a.minuteOfDay <= b.minuteOfDay),
        isTrue,
      );
    }
  });
}
