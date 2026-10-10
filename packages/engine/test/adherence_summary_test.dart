import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-149 (and the band of MM-123): what the user did over a week, as facts.
void main() {
  final through = CalendarDate(2026, 3, 14);
  final from = through.addDays(-6);

  TargetsRecord targets(
    double kcal, {
    CalendarDate? effectiveFrom,
    double proteinMinimumG = 130,
  }) => TargetsRecord(
    effectiveFrom: effectiveFrom ?? from.addDays(-30),
    targets: DailyTargets(
      kcal: kcal,
      proteinG: 160,
      proteinMinimumG: proteinMinimumG,
      fatG: 70,
      carbsG: 220,
      weeklyRateFraction: -0.005,
    ),
    mode: GoalMode.fatLoss,
    tdeeKcal: 2600,
    tdeeSigmaKcal: 200,
    tdeeStatus: TdeeStatus.updated,
  );

  IntakeDay day(
    int offset,
    double kcal, {
    double protein = 140,
    DayCompleteness completeness = DayCompleteness.complete,
    double estimatedShare = 0,
  }) => IntakeDay(
    date: from.addDays(offset),
    kcal: kcal,
    proteinG: protein,
    carbsG: 200,
    fatG: 70,
    completeness: completeness,
    estimatedShare: estimatedShare,
  );

  WeightObservation weigh(int offset) =>
      WeightObservation(date: from.addDays(offset), weightKg: 80);

  AdherenceSummary summarize(
    List<IntakeDay> intake, {
    double target = 2100,
    double? floor = 1500,
    List<WeightObservation> weights = const [],
  }) => summarizeAdherence(
    through: through,
    intake: intake,
    weights: weights,
    history: [targets(target)],
    floorKcal: floor,
  );

  group('the band (MM-123)', () {
    test('is the larger of 5% and 100 kcal', () {
      expect(const CalorieBand(2400).lowKcal, 2280);
      expect(const CalorieBand(2400).highKcal, 2520);
      expect(const CalorieBand(1400).lowKcal, 1300);
      expect(const CalorieBand(1400).highKcal, 1500);
    });

    test('inside is on target; outside is below or above', () {
      IntakeStanding at(double kcal) =>
          intakeStandingOf(kcal: kcal, targetKcal: 2400);
      expect(at(2310), IntakeStanding.onTarget);
      expect(at(2200), IntakeStanding.below);
      expect(at(2560), IntakeStanding.above);
    });

    test('below the floor is never on target', () {
      expect(
        intakeStandingOf(kcal: 1450, targetKcal: 1500, floorKcal: 1500),
        IntakeStanding.belowFloor,
      );
    });
  });

  test('a typical week states each fact', () {
    final s = summarize(
      [
        day(0, 2200),
        day(1, 2150, protein: 120),
        day(2, 2180),
        day(3, 2170),
        day(4, 2200),
        day(5, 900, completeness: DayCompleteness.partial),
      ],
      weights: [for (var i = 0; i < 6; i++) weigh(i)],
    );
    expect(s.daysLogged, 6);
    expect(s.completeDays, 5);
    expect(s.weighIns, 6);
    expect(s.averageIntakeKcal, closeTo(2180, 1e-9));
    expect(s.averageTargetKcal, 2100);
    expect(s.standing, IntakeStanding.onTarget);
    expect(s.proteinDays, 4);
    expect(s.mostlyEstimated, isFalse);
    expect(s.workouts, isNull);
  });

  test('over and under by the same amount are the same distance', () {
    final over = summarize([for (var i = 0; i < 5; i++) day(i, 2350)]);
    final under = summarize([for (var i = 0; i < 5; i++) day(i, 1850)]);
    expect(over.standing, IntakeStanding.above);
    expect(under.standing, IntakeStanding.below);
    expect(over.distanceKcal, 250);
    expect(under.distanceKcal, -250);
  });

  test('a week averaging below the floor is described as below it', () {
    final s = summarize([
      for (var i = 0; i < 6; i++) day(i, 1050),
    ], target: 1900);
    expect(s.standing, IntakeStanding.belowFloor);
  });

  test('partial and unlogged days are not counted against anything', () {
    final s = summarize([
      day(0, 2100),
      day(1, 2100),
      day(2, 700, completeness: DayCompleteness.partial),
    ]);
    expect(s.daysLogged, 3);
    expect(s.completeDays, 2);
    expect(s.averageIntakeKcal, 2100, reason: 'rests on the 2 complete days');
  });

  test('an unmarked day far below the usual intake is not a whole day', () {
    final s = summarize([
      for (var i = 0; i < 5; i++)
        day(i, 2100, completeness: DayCompleteness.unmarked),
      day(5, 600, completeness: DayCompleteness.unmarked),
    ]);
    expect(s.daysLogged, 6);
    expect(s.completeDays, 5);
  });

  test('a week mostly from estimates says so', () {
    final s = summarize([
      for (var i = 0; i < 5; i++) day(i, 2000, estimatedShare: 0.6),
    ]);
    expect(s.mostlyEstimated, isTrue);
    expect(
      summarize([for (var i = 0; i < 5; i++) day(i, 2000, estimatedShare: 0.4)])
          .mostlyEstimated,
      isFalse,
    );
  });

  test('with nothing logged there is no average and no standing', () {
    final s = summarize(const []);
    expect(s.daysLogged, 0);
    expect(s.averageIntakeKcal, isNull);
    expect(s.standing, isNull);
    expect(s.proteinDays, isNull);
  });

  test('the weekly target is the average of the targets in force', () {
    final s = summarizeAdherence(
      through: through,
      intake: [for (var i = 0; i < 7; i++) day(i, 2000)],
      weights: const [],
      history: [
        targets(2100),
        targets(2000, effectiveFrom: from.addDays(4)),
      ],
    );
    // Four days at 2,100 and three at 2,000.
    expect(s.averageTargetKcal, closeTo((4 * 2100 + 3 * 2000) / 7, 1e-9));
  });

  test('days outside the week are not counted', () {
    final s = summarize([
      IntakeDay(
        date: from.addDays(-1),
        kcal: 2100,
        proteinG: 140,
        carbsG: 200,
        fatG: 70,
        completeness: DayCompleteness.complete,
      ),
      day(0, 2100),
    ]);
    expect(s.daysLogged, 1);
    expect(s.completeDays, 1);
  });
}
