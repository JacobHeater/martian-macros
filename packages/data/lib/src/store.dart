import 'dart:async';

import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'database.dart';

/// Typed access to everything the app persists. Speaks domain objects;
/// nothing outside this package sees table rows.
final class MmStore {
  MmStore(this._db);

  final AppDatabase _db;

  Future<void> close() => _db.close();

  // ---- Setup ----------------------------------------------------------

  Stream<UserSetup?> watchSetup() =>
      _db.select(_db.setups).watchSingleOrNull().map(_setupOrNull);

  Future<UserSetup?> loadSetup() async =>
      _setupOrNull(await _db.select(_db.setups).getSingleOrNull());

  Future<void> saveSetup(UserSetup s) => _db
      .into(_db.setups)
      .insertOnConflictUpdate(
        SetupsCompanion.insert(
          id: const Value(1),
          sex: s.profile.sex.name,
          birthEpochDay: s.profile.birthDate.epochDay,
          heightCm: s.profile.heightCm,
          trainingStatus: s.trainingStatus,
          trainingDaysPerWeek: s.trainingDaysPerWeek,
          goalMode: s.goalMode,
          unitSystem: s.unitSystem,
          onboardedEpochDay: s.onboardedOn.epochDay,
          bodyFatPercent: Value(s.bodyFatPercent),
          requestedLossFraction: Value(s.requestedLossFraction),
          pregnant: Value(s.screening.pregnant),
          breastfeeding: Value(s.screening.breastfeeding),
          eatingDisorderHistory: Value(s.screening.eatingDisorderHistory),
          chronicKidneyDisease: Value(s.screening.chronicKidneyDisease),
          androgenUse: Value(s.screening.androgenUse),
          pcos: Value(s.screening.pcos),
          menopause: Value(s.screening.menopause),
          thyroidCondition: Value(s.screening.thyroidCondition),
        ),
      );

  UserSetup? _setupOrNull(SetupRow? r) => r == null
      ? null
      : UserSetup(
          profile: Profile(
            // Throws on anything but male/female: never defaults.
            sex: BiologicalSex.parse(r.sex),
            birthDate: CalendarDate.fromEpochDay(r.birthEpochDay),
            heightCm: r.heightCm,
          ),
          screening: ScreeningAnswers(
            pregnant: r.pregnant,
            breastfeeding: r.breastfeeding,
            eatingDisorderHistory: r.eatingDisorderHistory,
            chronicKidneyDisease: r.chronicKidneyDisease,
            androgenUse: r.androgenUse,
            pcos: r.pcos,
            menopause: r.menopause,
            thyroidCondition: r.thyroidCondition,
          ),
          trainingStatus: r.trainingStatus,
          trainingDaysPerWeek: r.trainingDaysPerWeek,
          goalMode: r.goalMode,
          onboardedOn: CalendarDate.fromEpochDay(r.onboardedEpochDay),
          unitSystem: r.unitSystem,
          bodyFatPercent: r.bodyFatPercent,
          requestedLossFraction: r.requestedLossFraction,
        );

  // ---- Weight ---------------------------------------------------------

  Stream<List<WeightObservation>> watchWeights() =>
      (_db.select(_db.weightEntries)
            ..orderBy([(t) => OrderingTerm.asc(t.epochDay)]))
          .watch()
          .map((rows) => [for (final r in rows) _weight(r)]);

  /// Sets the weigh-in for [date], replacing any existing one.
  Future<void> saveWeight(CalendarDate date, double weightKg) => _db
      .into(_db.weightEntries)
      .insertOnConflictUpdate(
        WeightEntriesCompanion.insert(
          epochDay: Value(date.epochDay),
          weightKg: weightKg,
        ),
      );

  Future<void> deleteWeight(CalendarDate date) => (_db.delete(
    _db.weightEntries,
  )..where((t) => t.epochDay.equals(date.epochDay))).go();

  WeightObservation _weight(WeightRow r) => WeightObservation(
    date: CalendarDate.fromEpochDay(r.epochDay),
    weightKg: r.weightKg,
    deviceId: r.deviceId,
  );

  // ---- Waist ----------------------------------------------------------

  Stream<List<WaistObservation>> watchWaist() =>
      (_db.select(
        _db.waistEntries,
      )..orderBy([(t) => OrderingTerm.asc(t.epochDay)])).watch().map(
        (rows) => [
          for (final r in rows)
            WaistObservation(
              date: CalendarDate.fromEpochDay(r.epochDay),
              waistCm: r.waistCm,
            ),
        ],
      );

  Future<void> saveWaist(CalendarDate date, double waistCm) => _db
      .into(_db.waistEntries)
      .insertOnConflictUpdate(
        WaistEntriesCompanion.insert(
          epochDay: Value(date.epochDay),
          waistCm: waistCm,
        ),
      );

  // ---- Food log -------------------------------------------------------

  Stream<List<FoodEntry>> watchFood(CalendarDate date) =>
      (_db.select(_db.foodEntries)
            ..where((t) => t.epochDay.equals(date.epochDay))
            ..orderBy([(t) => OrderingTerm.asc(t.id)]))
          .watch()
          .map((rows) => [for (final r in rows) _food(r)]);

  Future<int> addFood(FoodEntry e) => _db
      .into(_db.foodEntries)
      .insert(
        FoodEntriesCompanion.insert(
          epochDay: e.date.epochDay,
          meal: e.meal,
          name: e.name,
          kcal: e.kcal,
          proteinG: e.proteinG,
          carbsG: e.carbsG,
          fatG: e.fatG,
          quantitySource: e.source,
        ),
      );

  Future<void> deleteFood(int id) =>
      (_db.delete(_db.foodEntries)..where((t) => t.id.equals(id))).go();

  /// The most recently logged distinct foods, newest first, for one-tap
  /// re-logging.
  Stream<List<FoodEntry>> watchRecentFoods({int limit = 20}) =>
      (_db.select(_db.foodEntries)
            ..orderBy([(t) => OrderingTerm.desc(t.id)])
            ..limit(200))
          .watch()
          .map((rows) {
            final seen = <String>{};
            return [
              for (final r in rows)
                if (seen.add(r.name.toLowerCase())) _food(r),
            ].take(limit).toList();
          });

  FoodEntry _food(FoodRow r) => FoodEntry(
    id: r.id,
    date: CalendarDate.fromEpochDay(r.epochDay),
    meal: r.meal,
    name: r.name,
    kcal: r.kcal,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    source: r.quantitySource,
  );

  // ---- Day completeness ----------------------------------------------

  Stream<DayCompleteness> watchCompleteness(CalendarDate date) =>
      (_db.select(_db.dayMarks)..where((t) => t.epochDay.equals(date.epochDay)))
          .watchSingleOrNull()
          .map((r) => r?.completeness ?? DayCompleteness.unmarked);

  Future<void> setCompleteness(CalendarDate date, DayCompleteness c) => _db
      .into(_db.dayMarks)
      .insertOnConflictUpdate(
        DayMarksCompanion.insert(
          epochDay: Value(date.epochDay),
          completeness: c,
        ),
      );

  /// One intake observation per day that has any food logged, from [since].
  Stream<List<IntakeDay>> watchIntakeDays({required CalendarDate since}) {
    final food = (_db.select(
      _db.foodEntries,
    )..where((t) => t.epochDay.isBiggerOrEqualValue(since.epochDay))).watch();
    final marks = _db.select(_db.dayMarks).watch();
    return _combine(food, marks, (foodRows, markRows) {
      final markByDay = {for (final m in markRows) m.epochDay: m.completeness};
      final byDay = <int, List<FoodEntry>>{};
      for (final r in foodRows) {
        byDay.putIfAbsent(r.epochDay, () => []).add(_food(r));
      }
      final days = byDay.keys.toList()..sort();
      return [
        for (final day in days)
          intakeDayFrom(
            CalendarDate.fromEpochDay(day),
            byDay[day]!,
            completeness: markByDay[day] ?? DayCompleteness.unmarked,
          ),
      ];
    });
  }

  // ---- Targets --------------------------------------------------------

  Stream<List<TargetsRecord>> watchTargetsHistory() =>
      (_db.select(_db.targetsHistory)
            ..orderBy([(t) => OrderingTerm.asc(t.effectiveEpochDay)]))
          .watch()
          .map((rows) => [for (final r in rows) _targets(r)]);

  Future<void> saveTargets(TargetsRecord r) => _db
      .into(_db.targetsHistory)
      .insertOnConflictUpdate(
        TargetsHistoryCompanion.insert(
          effectiveEpochDay: Value(r.effectiveFrom.epochDay),
          mode: r.mode,
          kcal: r.targets.kcal,
          proteinG: r.targets.proteinG,
          fatG: r.targets.fatG,
          carbsG: r.targets.carbsG,
          weeklyRateFraction: r.targets.weeklyRateFraction,
          flags: Value(r.targets.flags.map((f) => f.name).join(',')),
          tdeeKcal: r.tdeeKcal,
          tdeeSigmaKcal: r.tdeeSigmaKcal,
          tdeeStatus: r.tdeeStatus,
        ),
      );

  TargetsRecord _targets(TargetsRow r) => TargetsRecord(
    effectiveFrom: CalendarDate.fromEpochDay(r.effectiveEpochDay),
    mode: r.mode,
    tdeeKcal: r.tdeeKcal,
    tdeeSigmaKcal: r.tdeeSigmaKcal,
    tdeeStatus: r.tdeeStatus,
    targets: DailyTargets(
      kcal: r.kcal,
      proteinG: r.proteinG,
      fatG: r.fatG,
      carbsG: r.carbsG,
      weeklyRateFraction: r.weeklyRateFraction,
      flags: {
        for (final name in r.flags.split(','))
          if (name.isNotEmpty) TargetFlag.values.byName(name),
      },
    ),
  );

  /// Deletes everything. Used by "reset app" in settings.
  Future<void> wipe() => _db.transaction(() async {
    for (final table in _db.allTables) {
      await _db.delete(table).go();
    }
  });
}

/// Emits `combine(a, b)` whenever either stream emits, once both have.
Stream<R> _combine<A, B, R>(
  Stream<A> a,
  Stream<B> b,
  R Function(A, B) combine,
) {
  late final StreamController<R> controller;
  StreamSubscription<A>? subA;
  StreamSubscription<B>? subB;
  late A lastA;
  late B lastB;
  var hasA = false, hasB = false;

  void emit() {
    if (hasA && hasB) controller.add(combine(lastA, lastB));
  }

  controller = StreamController<R>(
    onListen: () {
      subA = a.listen((value) {
        lastA = value;
        hasA = true;
        emit();
      }, onError: controller.addError);
      subB = b.listen((value) {
        lastB = value;
        hasB = true;
        emit();
      }, onError: controller.addError);
    },
    onCancel: () async {
      await subA?.cancel();
      await subB?.cancel();
    },
  );
  return controller.stream;
}
