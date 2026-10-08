import 'package:drift/native.dart';
import 'package:mm_data/mm_data.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:test/test.dart';

/// What the database itself enforces, independent of any repository. The
/// repository behavior is in the contract suites (drift_contracts_test).
void main() {
  late AppDatabase db;
  late DriftRepositories repos;

  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    repos = DriftRepositories(db);
  });
  tearDown(() => repos.close());

  final day = CalendarDate(2026, 10, 5);

  test('the schema itself rejects any sex outside the binary', () async {
    await repos.setup.saveSetup(typicalSetup(sex: BiologicalSex.female));
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
    await repos.setup.saveSetup(typicalSetup());
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

  test('rejects impossible weights', () async {
    await expectLater(
      repos.weights.saveWeight(day, 5),
      throwsA(isA<Exception>()),
    );
  });

  test('rejects impossible waist measurements', () async {
    await expectLater(repos.waist.saveWaist(day, 5), throwsA(isA<Exception>()));
  });
}
