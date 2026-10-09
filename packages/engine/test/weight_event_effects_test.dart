import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

void main() {
  final start = CalendarDate(2026, 1, 1);

  test('only two passing events in a rolling 14-day window affect noise', () {
    final events = [
      WeightEvent(
        date: start.addDays(14),
        type: WeightEventType.largeOrSaltyMeal,
      ),
      WeightEvent(date: start.addDays(13), type: WeightEventType.newTraining),
      WeightEvent(date: start.addDays(7), type: WeightEventType.travel),
      WeightEvent(date: start, type: WeightEventType.illness),
    ];

    expect(effectiveWeightEvents(events).map((event) => event.date), [
      start,
      start.addDays(7),
      start.addDays(14),
    ]);
  });

  test('a third passing event does not change any smoothed trend point', () {
    final events = [
      WeightEvent(date: start.addDays(15), type: WeightEventType.travel),
      WeightEvent(date: start.addDays(19), type: WeightEventType.illness),
      WeightEvent(date: start.addDays(24), type: WeightEventType.newTraining),
    ];
    final observations = [
      for (var day = 0; day < 35; day++)
        WeightObservation(
          date: start.addDays(day),
          weightKg: 80 + (day.isEven ? 0.3 : -0.3),
        ),
    ];
    List<WeightTrendPoint> smooth(Iterable<WeightEvent> given) =>
        const WeightTrendModel().smooth(
          observations,
          noiseMultiplier: passingWeightEventNoise(
            effectiveWeightEvents(given),
          ),
        );
    final firstTwo = smooth(events.take(2));
    final allThree = smooth(events);
    expect(
      allThree.map((point) => point.levelKg),
      firstTwo.map((point) => point.levelKg),
    );
    expect(
      allThree.map((point) => point.levelVariance),
      firstTwo.map((point) => point.levelVariance),
    );
  });

  test('illness noise covers the day before through seven days after', () {
    final event = WeightEvent(date: start, type: WeightEventType.illness);
    final noise = passingWeightEventNoise([event]);

    expect(noise(start.addDays(-1)), weightEventNoiseMultiplier);
    expect(noise(start), weightEventNoiseMultiplier);
    expect(noise(start.addDays(7)), weightEventNoiseMultiplier);
    expect(noise(start.addDays(8)), 1);
  });

  test('other passing-event noise covers the day before through four days '
      'after', () {
    final event = WeightEvent(date: start, type: WeightEventType.travel);
    final noise = passingWeightEventNoise([event]);

    expect(noise(start.addDays(-1)), weightEventNoiseMultiplier);
    expect(noise(start.addDays(4)), weightEventNoiseMultiplier);
    expect(noise(start.addDays(5)), 1);
  });

  test('creatine uses a directional 1.5 kg prior spread across 21 updates', () {
    final startShift = creatineEventShift([
      WeightEvent(date: start, type: WeightEventType.startedCreatine),
    ]);
    final shifts = [
      for (var day = 0; day < weightEventStepDays; day++)
        startShift(start.addDays(day))!,
    ];
    expect(
      shifts.fold(0.0, (sum, shift) => sum + shift.levelMeanKg),
      closeTo(weightEventStepPriorKg, 1e-9),
    );
    expect(
      math.sqrt(
        shifts.fold(
          0.0,
          (sum, shift) => sum + shift.levelSigmaKg * shift.levelSigmaKg,
        ),
      ),
      closeTo(weightEventStepPriorKg, 1e-9),
    );
    expect(startShift(start.addDays(weightEventStepDays)), isNull);

    final stopShift = creatineEventShift([
      WeightEvent(date: start, type: WeightEventType.stoppedCreatine),
    ]);
    expect(stopShift(start)!.levelMeanKg, lessThan(0));
  });

  test('creatine transition excludes its full settling window from TDEE', () {
    final weights = [
      for (var day = 0; day <= 30; day++)
        WeightObservation(date: start.addDays(day), weightKg: 80),
    ];
    final intake = [
      for (var day = 0; day <= 30; day++)
        IntakeDay(
          date: start.addDays(day),
          kcal: 2200,
          proteinG: 150,
          carbsG: 250,
          fatG: 70,
          relativeSigma: 0.05,
        ),
    ];
    final setup = UserSetup(
      profile: Profile(
        sex: BiologicalSex.male,
        birthDate: CalendarDate(1994, 3, 1),
        heightCm: 180,
      ),
      screening: const ScreeningAnswers(),
      trainingStatus: TrainingStatus.intermediate,
      trainingDaysPerWeek: 3,
      goalMode: GoalMode.maintenance,
      onboardedOn: start,
    );

    final snapshot = analyze(
      setup: setup,
      weights: weights,
      intake: intake,
      today: start.addDays(31),
      weightEvents: [
        WeightEvent(
          date: start.addDays(5),
          type: WeightEventType.startedCreatine,
        ),
      ],
    )!;

    expect(snapshot.tdee.status, TdeeStatus.held);
    expect(snapshot.tdee.settlingUntil, start.addDays(25));
  });

  test('a creatine prior follows observed data rather than forcing a jump', () {
    final event = WeightEvent(
      date: start.addDays(15),
      type: WeightEventType.startedCreatine,
    );
    final observations = [
      for (var day = 0; day < 42; day++)
        WeightObservation(date: start.addDays(day), weightKg: 80),
    ];
    final plain = const WeightTrendModel().smooth(observations).last.levelKg;
    final shifted = const WeightTrendModel()
        .smooth(observations, shift: creatineEventShift([event]))
        .last
        .levelKg;

    expect((shifted - plain).abs(), lessThan(0.5));
  });

  test('onboarding creatine is deduplicated against an explicit event', () {
    final event = WeightEvent(
      date: start,
      type: WeightEventType.startedCreatine,
    );
    expect(
      creatineWeightEvents(events: [event], creatineStartedOn: start),
      hasLength(1),
    );
  });
}
