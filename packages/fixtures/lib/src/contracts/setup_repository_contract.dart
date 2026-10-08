import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import '../typical_setup.dart';
import 'expect_change_emits.dart';

/// What every [SetupRepository] must do.
void setupRepositoryContract(String name, SetupRepository Function() create) {
  group('$name as a SetupRepository', () {
    late SetupRepository repo;
    setUp(() => repo = create());

    test('has no setup before onboarding', () async {
      expect(await repo.loadSetup(), isNull);
      expect(await repo.watchSetup().first, isNull);
    });

    test('stores and returns every field, including sex', () async {
      final saved = typicalSetup(sex: BiologicalSex.female);
      await repo.saveSetup(saved);
      final loaded = (await repo.loadSetup())!;
      expect(loaded.profile.sex, BiologicalSex.female);
      expect(loaded.profile.heightCm, saved.profile.heightCm);
      expect(
        loaded.profile.birthDate.epochDay,
        saved.profile.birthDate.epochDay,
      );
      expect(loaded.goalMode, saved.goalMode);
      expect(loaded.trainingStatus, saved.trainingStatus);
      expect(loaded.trainingDaysPerWeek, saved.trainingDaysPerWeek);
      expect(loaded.unitSystem, saved.unitSystem);
      expect(loaded.onboardedOn.epochDay, saved.onboardedOn.epochDay);
      expect(loaded.screening.pregnant, isFalse);
    });

    test('keeps daily activity, and a new setup defaults to light', () async {
      await repo.saveSetup(typicalSetup(dailyActivity: DailyActivity.onFeet));
      expect((await repo.loadSetup())!.dailyActivity, DailyActivity.onFeet);
      await repo.saveSetup(typicalSetup());
      expect((await repo.loadSetup())!.dailyActivity, DailyActivity.light);
    });

    test('keeps screening answers', () async {
      await repo.saveSetup(
        typicalSetup(
          screening: const ScreeningAnswers(eatingDisorderHistory: true),
        ),
      );
      final loaded = (await repo.loadSetup())!;
      expect(loaded.screening.eatingDisorderHistory, isTrue);
      expect(loaded.screening.pcos, isFalse);
    });

    test('there is only one setup: saving replaces it', () async {
      await repo.saveSetup(typicalSetup(goalMode: GoalMode.fatLoss));
      await repo.saveSetup(typicalSetup(goalMode: GoalMode.maintenance));
      expect((await repo.loadSetup())!.goalMode, GoalMode.maintenance);
    });

    test('emits null first, then the saved setup', () async {
      await expectChangeEmits(
        repo.watchSetup().map((s) => s?.goalMode),
        before: null,
        change: () => repo.saveSetup(typicalSetup(goalMode: GoalMode.recomp)),
        after: GoalMode.recomp,
      );
    });
  });
}
