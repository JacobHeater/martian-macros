import 'package:drift/native.dart';
import 'package:mm_data/mm_data.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

void main() {
  late AppDatabase db;
  late MmStore store;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    store = MmStore(db);
  });
  tearDown(() => store.close());

  final day = CalendarDate(2026, 10, 5);

  UserSetup setup({BiologicalSex sex = BiologicalSex.female}) => UserSetup(
    profile: Profile(
      sex: sex,
      birthDate: CalendarDate(1992, 4, 20),
      heightCm: 168,
    ),
    screening: const ScreeningAnswers(thyroidCondition: true),
    trainingStatus: TrainingStatus.novice,
    trainingDaysPerWeek: 3,
    goalMode: GoalMode.recomp,
    onboardedOn: day,
    bodyFatPercent: 29.5,
  );

  FoodEntry food(
    String name,
    double kcal, {
    CalendarDate? on,
    QuantitySource source = QuantitySource.labelServing,
  }) => FoodEntry(
    id: 0,
    date: on ?? day,
    meal: Meal.lunch,
    name: name,
    kcal: kcal,
    proteinG: kcal * 0.3 / 4,
    carbsG: kcal * 0.4 / 4,
    fatG: kcal * 0.3 / 9,
    source: source,
  );

  group('setup', () {
    test('is null before onboarding', () async {
      expect(await store.loadSetup(), isNull);
    });

    test('round-trips every field', () async {
      await store.saveSetup(setup());
      final loaded = (await store.loadSetup())!;
      expect(loaded.profile.sex, BiologicalSex.female);
      expect(loaded.profile.birthDate, CalendarDate(1992, 4, 20));
      expect(loaded.profile.heightCm, 168);
      expect(loaded.screening.thyroidCondition, isTrue);
      expect(loaded.screening.pregnant, isFalse);
      expect(loaded.trainingStatus, TrainingStatus.novice);
      expect(loaded.goalMode, GoalMode.recomp);
      expect(loaded.onboardedOn, day);
      expect(loaded.unitSystem, UnitSystem.imperial);
      expect(loaded.bodyFatPercent, 29.5);
    });

    test('saving again updates the single row', () async {
      await store.saveSetup(setup());
      await store.saveSetup(setup().copyWith(goalMode: GoalMode.fatLoss));
      expect((await store.loadSetup())!.goalMode, GoalMode.fatLoss);
    });

    test('the schema itself rejects any sex outside the binary', () async {
      await store.saveSetup(setup());
      for (final bad in ['other', 'unknown', '', 'Male']) {
        await expectLater(
          db.customStatement('UPDATE setups SET sex = ?', [bad]),
          throwsA(isA<Exception>()),
          reason: 'sex = "$bad" must violate the CHECK constraint',
        );
      }
      await expectLater(
        db.customStatement('UPDATE setups SET sex = NULL'),
        throwsA(isA<Exception>()),
      );
    });

    test('the schema allows only one setup row', () async {
      await store.saveSetup(setup());
      await expectLater(
        db.customStatement(
          'INSERT INTO setups (id, sex, birth_epoch_day, height_cm, '
          'training_status, training_days_per_week, goal_mode, unit_system, '
          'onboarded_epoch_day) '
          "VALUES (2, 'male', 0, 180, 'novice', 3, 'recomp', 'metric', 0)",
        ),
        throwsA(isA<Exception>()),
      );
    });
  });

  group('weight', () {
    test('keeps one reading per day, latest write wins', () async {
      await store.saveWeight(day, 80.2);
      await store.saveWeight(day, 80.6);
      await store.saveWeight(day.addDays(-1), 80.9);
      final weights = await store.watchWeights().first;
      expect(weights.map((w) => w.weightKg), [80.9, 80.6]);
    });

    test('rejects impossible weights', () async {
      await expectLater(store.saveWeight(day, 5), throwsA(isA<Exception>()));
    });

    test('deletes a reading', () async {
      await store.saveWeight(day, 80);
      await store.deleteWeight(day);
      expect(await store.watchWeights().first, isEmpty);
    });
  });

  group('food log', () {
    test('lists a day in logging order and deletes by id', () async {
      await store.addFood(food('Oats', 300));
      final id = await store.addFood(food('Chicken', 400));
      await store.addFood(food('Other day', 999, on: day.addDays(1)));
      expect((await store.watchFood(day).first).map((e) => e.name), [
        'Oats',
        'Chicken',
      ]);
      await store.deleteFood(id);
      expect(await store.watchFood(day).first, hasLength(1));
    });

    test('recent foods are distinct by name, newest first', () async {
      await store.addFood(food('Oats', 300));
      await store.addFood(food('Chicken', 400));
      await store.addFood(food('oats', 320));
      final recent = await store.watchRecentFoods().first;
      expect(recent.map((e) => e.name), ['oats', 'Chicken']);
      expect(recent.first.kcal, 320);
    });

    test('aggregates intake days with marks and measurement quality', () async {
      await store.addFood(food('A', 600, source: QuantitySource.weighed));
      await store.addFood(food('B', 400, source: QuantitySource.palm));
      await store.addFood(food('C', 500, on: day.addDays(-1)));
      await store.addFood(food('Old', 500, on: day.addDays(-90)));
      await store.setCompleteness(day, DayCompleteness.complete);

      final days = await store.watchIntakeDays(since: day.addDays(-30)).first;
      expect(days.map((d) => d.date), [day.addDays(-1), day]);
      final today = days.last;
      expect(today.kcal, 1000);
      expect(today.completeness, DayCompleteness.complete);
      expect(today.weighedShare, closeTo(0.6, 1e-9));
      // sqrt((600*.05)^2 + (400*.25)^2) / 1000
      expect(today.relativeSigma, closeTo(0.1044, 1e-4));
      expect(days.first.completeness, DayCompleteness.unmarked);
    });

    test('intake stream re-emits when a day is marked', () async {
      await store.addFood(food('A', 600));
      final emissions = <DayCompleteness>[];
      final sub = store
          .watchIntakeDays(since: day.addDays(-1))
          .listen((d) => emissions.add(d.single.completeness));
      await pumpEventQueue();
      await store.setCompleteness(day, DayCompleteness.partial);
      await pumpEventQueue();
      await sub.cancel();
      expect(emissions.first, DayCompleteness.unmarked);
      expect(emissions.last, DayCompleteness.partial);
    });
  });

  group('targets history', () {
    test('round-trips targets, flags, and TDEE basis in date order', () async {
      TargetsRecord record(CalendarDate from, double kcal) => TargetsRecord(
        effectiveFrom: from,
        mode: GoalMode.fatLoss,
        tdeeKcal: 2500,
        tdeeSigmaKcal: 180,
        tdeeStatus: TdeeStatus.updated,
        targets: DailyTargets(
          kcal: kcal,
          proteinG: 160,
          fatG: 60,
          carbsG: 200,
          weeklyRateFraction: -0.0075,
          flags: const {TargetFlag.rateLimited, TargetFlag.proteinCapped},
        ),
      );
      await store.saveTargets(record(day.addDays(7), 1900));
      await store.saveTargets(record(day, 2000));

      final history = await store.watchTargetsHistory().first;
      expect(history.map((r) => r.targets.kcal), [2000, 1900]);
      expect(history.last.targets.flags, {
        TargetFlag.rateLimited,
        TargetFlag.proteinCapped,
      });
      expect(history.last.tdeeStatus, TdeeStatus.updated);
      expect(history.last.targets.weeklyRateFraction, -0.0075);
    });
  });

  test('wipe clears everything', () async {
    await store.saveSetup(setup());
    await store.saveWeight(day, 80);
    await store.addFood(food('A', 100));
    await store.wipe();
    expect(await store.loadSetup(), isNull);
    expect(await store.watchWeights().first, isEmpty);
    expect(await store.watchFood(day).first, isEmpty);
  });
}
