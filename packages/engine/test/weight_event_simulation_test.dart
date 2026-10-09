import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

import 'support/simulate_logs.dart';
import 'support/synthetic_user.dart';

void main() {
  final start = CalendarDate(2026, 1, 1);
  final creatineStartedOn = start.addDays(21);

  UserSetup setup() => UserSetup(
    profile: Profile(
      sex: BiologicalSex.male,
      birthDate: CalendarDate(1994, 3, 1),
      heightCm: 180,
    ),
    screening: const ScreeningAnswers(),
    trainingStatus: TrainingStatus.intermediate,
    trainingDaysPerWeek: 3,
    goalMode: GoalMode.fatLoss,
    onboardedOn: start,
    bodyFatPercent: 25,
  );

  test(
    'declared creatine step holds targets until its transition is excluded',
    () {
      final logs = simulate(
        SyntheticUser(
          seed: 314,
          start: start,
          baseTdeeKcal: 2800,
          adherenceSigmaKcal: 0,
          adaptationKcalPerKg: 0,
          entrySigma: 0,
        ),
        days: 56,
        loggedKcal: 2300,
      );
      final waterStep = [
        for (final observation in logs.weights)
          WeightObservation(
            date: observation.date,
            weightKg:
                observation.weightKg +
                1.5 *
                    (creatineStartedOn.daysUntil(observation.date) + 1).clamp(
                      0,
                      10,
                    ) /
                    10,
          ),
      ];
      final initialTargets = TargetsRecord(
        effectiveFrom: start,
        mode: GoalMode.fatLoss,
        tdeeKcal: 2800,
        tdeeSigmaKcal: 200,
        tdeeStatus: TdeeStatus.updated,
        targets: const DailyTargets(
          kcal: 2300,
          proteinG: 160,
          fatG: 70,
          carbsG: 250,
          weeklyRateFraction: -0.0075,
        ),
      );
      final undeclaredToday = start.addDays(35);
      final undeclared = analyze(
        setup: setup(),
        weights: [
          for (final observation in waterStep)
            if (observation.date.isBefore(undeclaredToday)) observation,
        ],
        intake: [
          for (final day in logs.intake)
            if (day.date.isBefore(undeclaredToday)) day,
        ],
        today: undeclaredToday,
        history: [initialTargets],
      )!;
      final noStepBaseline = analyze(
        setup: setup(),
        weights: [
          for (final observation in logs.weights)
            if (observation.date.isBefore(undeclaredToday)) observation,
        ],
        intake: [
          for (final day in logs.intake)
            if (day.date.isBefore(undeclaredToday)) day,
        ],
        today: undeclaredToday,
        history: [initialTargets],
      )!;
      final undeclaredError = noStepBaseline.tdee.kcal - undeclared.tdee.kcal;
      expect(undeclared.tdee.status, TdeeStatus.updated);
      expect(undeclaredError, closeTo(435, 25));
      for (final checkInDay in [28, 35, 42, 49]) {
        final today = start.addDays(checkInDay);
        final snapshot = analyze(
          setup: setup(),
          weights: [
            for (final observation in waterStep)
              if (observation.date.isBefore(today)) observation,
          ],
          intake: [
            for (final day in logs.intake)
              if (day.date.isBefore(today)) day,
          ],
          today: today,
          history: [initialTargets],
          weightEvents: [
            WeightEvent(
              date: creatineStartedOn,
              type: WeightEventType.startedCreatine,
            ),
          ],
        )!;
        final control = analyze(
          setup: setup(),
          weights: [
            for (final observation in logs.weights)
              if (observation.date.isBefore(today)) observation,
          ],
          intake: [
            for (final day in logs.intake)
              if (day.date.isBefore(today)) day,
          ],
          history: [initialTargets],
          today: today,
        )!;
        final declaredError = initialTargets.tdeeKcal - snapshot.tdee.kcal;
        expect(
          declaredError,
          lessThan(100),
          reason:
              'day $checkInDay: event=${snapshot.tdee.kcal}, '
              'pre-event=${initialTargets.tdeeKcal}',
        );
        expect(
          control.tdee.kcal - snapshot.tdee.kcal,
          lessThan(100),
          reason: 'day $checkInDay versus matched no-step control',
        );
        expect(declaredError, lessThan(undeclaredError));
        if (checkInDay == 49) {
          expect(snapshot.tdee.status, TdeeStatus.held);
          expect(
            snapshot.tdee.settlingUntil,
            creatineStartedOn.addDays(weightEventStepDays - 1),
          );
        }
        final next = nextTargets(
          setup: setup(),
          snapshot: snapshot,
          history: [initialTargets],
          today: today,
        );
        expect(
          next?.targets.kcal ?? initialTargets.targets.kcal,
          greaterThanOrEqualTo(initialTargets.targets.kcal),
          reason:
              'day $checkInDay must not lower the target because of the event',
        );
      }
      final recentEvent = analyze(
        setup: setup(),
        weights: logs.weights,
        intake: logs.intake,
        today: start.addDays(56),
        weightEvents: [
          WeightEvent(
            date: start.addDays(54),
            type: WeightEventType.startedCreatine,
          ),
        ],
      )!;
      expect(recentEvent.confidence.stability, isNot(ConfidenceLevel.good));
    },
  );

  test('a declared three-day travel water rise moves the trend less', () {
    final event = WeightEvent(
      date: start.addDays(20),
      type: WeightEventType.travel,
    );
    final observations = [
      for (var day = 0; day < 42; day++)
        WeightObservation(
          date: start.addDays(day),
          weightKg: 80 + (day >= 21 && day <= 23 ? 1.2 : 0),
        ),
    ];
    final model = const WeightTrendModel();
    final withoutEvent = model.smooth(observations);
    final withEvent = model.smooth(
      observations,
      noiseMultiplier: passingWeightEventNoise(effectiveWeightEvents([event])),
    );

    expect(withEvent[23].levelKg, lessThan(withoutEvent[23].levelKg));
  });

  test('a retrospective creatine event recomputes trend and expenditure', () {
    final logs = simulate(
      SyntheticUser(seed: 314, start: start, baseTdeeKcal: 2800),
      days: 56,
      loggedKcal: 2300,
    );
    final eventOn = start.addDays(42);
    final observations = [
      for (final observation in logs.weights)
        WeightObservation(
          date: observation.date,
          weightKg:
              observation.weightKg +
              1.5 * (eventOn.daysUntil(observation.date) + 1).clamp(0, 10) / 10,
        ),
    ];
    CoachSnapshot snapshot(List<WeightEvent> events) => analyze(
      setup: setup(),
      weights: observations,
      intake: logs.intake,
      today: start.addDays(56),
      weightEvents: events,
    )!;
    final before = snapshot(const []);
    final after = snapshot([
      WeightEvent(date: eventOn, type: WeightEventType.startedCreatine),
    ]);
    expect(
      after.trend[eventOn.epochDay - start.epochDay].levelKg,
      isNot(before.trend[eventOn.epochDay - start.epochDay].levelKg),
    );
    expect(after.tdee.kcal, isNot(before.tdee.kcal));
    expect(after.tdee.weighIns, lessThan(before.tdee.weighIns));
    expect(after.tdee.usableIntakeDays, lessThan(before.tdee.usableIntakeDays));
  });

  for (final type in [
    WeightEventType.startedCreatine,
    WeightEventType.stoppedCreatine,
  ]) {
    test('${type.name} resumes measured expenditure after settling', () {
      final logs = simulate(
        SyntheticUser(seed: 314, start: start, baseTdeeKcal: 2800),
        days: 84,
        loggedKcal: 2300,
      );
      final direction = type == WeightEventType.startedCreatine ? 1 : -1;
      final observations = [
        for (final observation in logs.weights)
          WeightObservation(
            date: observation.date,
            weightKg:
                observation.weightKg +
                direction *
                    1.5 *
                    (creatineStartedOn.daysUntil(observation.date) + 1).clamp(
                      0,
                      10,
                    ) /
                    10,
          ),
      ];
      final baseline = analyze(
        setup: setup(),
        weights: logs.weights,
        intake: logs.intake,
        today: start.addDays(84),
      )!;
      final declared = analyze(
        setup: setup(),
        weights: observations,
        intake: logs.intake,
        today: start.addDays(84),
        weightEvents: [WeightEvent(date: creatineStartedOn, type: type)],
      )!;
      expect(declared.tdee.status, TdeeStatus.updated);
      expect((declared.tdee.kcal - baseline.tdee.kcal).abs(), lessThan(100));
      expect(declared.confidence.stability, ConfidenceLevel.good);
    });
  }
}
