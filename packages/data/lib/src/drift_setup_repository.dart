import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [SetupRepository] over the Drift database. One row, id = 1.
final class DriftSetupRepository implements SetupRepository {
  DriftSetupRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<UserSetup?> watchSetup() =>
      _db.select(_db.setups).watchSingleOrNull().map(_setupOrNull);

  @override
  Future<UserSetup?> loadSetup() async =>
      _setupOrNull(await _db.select(_db.setups).getSingleOrNull());

  @override
  Future<void> saveSetup(UserSetup setup) => _db
      .into(_db.setups)
      .insertOnConflictUpdate(
        SetupsCompanion.insert(
          id: const Value(1),
          sex: setup.profile.sex.name,
          birthEpochDay: setup.profile.birthDate.epochDay,
          heightCm: setup.profile.heightCm,
          trainingStatus: setup.trainingStatus,
          trainingDaysPerWeek: setup.trainingDaysPerWeek,
          goalMode: setup.goalMode,
          unitSystem: setup.unitSystem,
          onboardedEpochDay: setup.onboardedOn.epochDay,
          bodyFatPercent: Value(setup.bodyFatPercent),
          requestedLossFraction: Value(setup.requestedLossFraction),
          pregnant: Value(setup.screening.pregnant),
          breastfeeding: Value(setup.screening.breastfeeding),
          eatingDisorderHistory: Value(setup.screening.eatingDisorderHistory),
          chronicKidneyDisease: Value(setup.screening.chronicKidneyDisease),
          androgenUse: Value(setup.screening.androgenUse),
          pcos: Value(setup.screening.pcos),
          menopause: Value(setup.screening.menopause),
          thyroidCondition: Value(setup.screening.thyroidCondition),
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
}
