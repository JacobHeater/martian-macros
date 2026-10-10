import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

/// MM-125: how protein is spread across the day, without a lecture.
void main() {
  final through = CalendarDate(2026, 3, 14);

  final targets = TargetsRecord(
    effectiveFrom: through.addDays(-60),
    mode: GoalMode.fatLoss,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 200,
    tdeeStatus: TdeeStatus.updated,
    targets: const DailyTargets(
      kcal: 2100,
      proteinG: 160,
      proteinMinimumG: 130,
      fatG: 70,
      carbsG: 220,
      weeklyRateFraction: -0.005,
    ),
  );

  IntakeDay day(int daysAgo, double protein) => IntakeDay(
    date: through.addDays(-daysAgo),
    kcal: 2100,
    proteinG: protein,
    carbsG: 200,
    fatG: 70,
    completeness: DayCompleteness.complete,
  );

  Map<Meal, double> meals({
    double breakfast = 30,
    double lunch = 30,
    double dinner = 30,
    double snack = 0,
  }) => {
    Meal.breakfast: breakfast,
    Meal.lunch: lunch,
    Meal.dinner: dinner,
    Meal.snack: snack,
  };

  List<Insight> find({
    required List<IntakeDay> intake,
    required Map<CalendarDate, Map<Meal, double>> mealProtein,
  }) => findInsights(
    through: through,
    intake: intake,
    weights: [
      for (var i = 0; i < 14; i++)
        WeightObservation(date: through.addDays(-i), weightKg: 85),
      WeightObservation(date: through.addDays(-40), weightKg: 86),
    ],
    history: [targets],
    mealProtein: mealProtein,
  );

  Insight? byMeal(List<Insight> all) =>
      all.where((i) => i.rule == InsightRule.proteinByMeal).firstOrNull;

  group('the marker', () {
    test('an 80 kg person with 30 g at lunch has it', () {
      expect(mealHasSolidProtein(proteinG: 30, weightKg: 80), isTrue);
    });

    test('23 g does not, and that says nothing', () {
      expect(mealHasSolidProtein(proteinG: 23, weightKg: 80), isFalse);
    });

    test('with no weight known there is no marker', () {
      expect(mealHasSolidProtein(proteinG: 60, weightKg: 0), isFalse);
    });
  });

  group('the insight', () {
    test('under the minimum on 10 of 14 days, breakfast almost empty', () {
      final found = byMeal(
        find(
          intake: [
            for (var i = 0; i < 10; i++) day(i, 95),
            for (var i = 10; i < 14; i++) day(i, 150),
          ],
          mealProtein: {
            for (var i = 0; i < 10; i++)
              through.addDays(-i): meals(
                breakfast: i < 8 ? 5 : 25,
                lunch: 40,
                dinner: 50,
              ),
            for (var i = 10; i < 14; i++) through.addDays(-i): meals(),
          },
        ),
      )!;
      expect(found.figures['meal'], Meal.breakfast.index);
      expect(found.figures['missedDays'], 10);
      expect(found.figures['lowDays'], 8);
    });

    test('names lunch when lunch is the empty one', () {
      final found = byMeal(
        find(
          intake: [for (var i = 0; i < 14; i++) day(i, 95)],
          mealProtein: {
            for (var i = 0; i < 14; i++)
              through.addDays(-i): meals(breakfast: 35, lunch: 4, dinner: 56),
          },
        ),
      )!;
      expect(found.figures['meal'], Meal.lunch.index);
    });

    test('meeting protein with 120 g at dinner never brings it', () {
      expect(
        byMeal(
          find(
            intake: [for (var i = 0; i < 14; i++) day(i, 140)],
            mealProtein: {
              for (var i = 0; i < 14; i++)
                through.addDays(-i): meals(
                  breakfast: 0,
                  lunch: 20,
                  dinner: 120,
                ),
            },
          ),
        ),
        isNull,
      );
    });

    test('missing protein with every meal carrying some brings none', () {
      expect(
        byMeal(
          find(
            intake: [for (var i = 0; i < 14; i++) day(i, 90)],
            mealProtein: {
              for (var i = 0; i < 14; i++) through.addDays(-i): meals(),
            },
          ),
        ),
        isNull,
      );
    });

    test('an empty meal on a few of the missed days is not a pattern', () {
      expect(
        byMeal(
          find(
            intake: [for (var i = 0; i < 14; i++) day(i, 95)],
            mealProtein: {
              for (var i = 0; i < 14; i++)
                through.addDays(-i): meals(breakfast: i < 5 ? 0 : 30),
            },
          ),
        ),
        isNull,
      );
    });

    test('with no meals known it says nothing', () {
      expect(
        byMeal(
          find(
            intake: [for (var i = 0; i < 14; i++) day(i, 95)],
            mealProtein: const {},
          ),
        ),
        isNull,
      );
    });

    test('snacks are never the meal named', () {
      expect(
        byMeal(
          find(
            intake: [for (var i = 0; i < 14; i++) day(i, 95)],
            mealProtein: {
              for (var i = 0; i < 14; i++) through.addDays(-i): meals(snack: 0),
            },
          ),
        ),
        isNull,
      );
    });

    test('it ranks below every other rule', () {
      final all = find(
        intake: [for (var i = 0; i < 14; i++) day(i, 95)],
        mealProtein: {
          for (var i = 0; i < 14; i++) through.addDays(-i): meals(breakfast: 0),
        },
      );
      expect(all.last.rule, InsightRule.proteinByMeal);
      expect(
        all.map((i) => i.rule),
        containsAll([InsightRule.proteinShort, InsightRule.proteinByMeal]),
      );
    });
  });
}
