import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// MM-126: a fiber guide that is shown only when the data supports it.
void main() {
  final day = CalendarDate(2026, 10, 5);
  FoodEntry entry(double kcal, {double? fiber}) => FoodEntry(
    id: 0,
    date: day,
    meal: Meal.lunch,
    name: 'x',
    kcal: kcal,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    source: QuantitySource.weighed,
    fiberG: fiber,
  );

  test('the guide is 14 g per 1,000 kcal', () {
    expect(
      fiberGuideG(kcalTarget: 2400, sex: BiologicalSex.male),
      closeTo(33.6, 1e-9),
    );
  });

  test('the minimum holds at low calories', () {
    expect(fiberGuideG(kcalTarget: 1300, sex: BiologicalSex.female), 21);
    expect(fiberGuideG(kcalTarget: 1300, sex: BiologicalSex.male), 25);
  });

  test('enough data: 85% of calories carry a fiber value', () {
    final d = FiberDay.of([entry(850, fiber: 20), entry(150)]);
    expect(d.coveredShare, closeTo(0.85, 1e-9));
    expect(d.enough, isTrue);
    expect(d.totalG, 20);
  });

  test('not enough data: 40% of calories were typed', () {
    final d = FiberDay.of([entry(600, fiber: 12), entry(400)]);
    expect(d.enough, isFalse);
  });

  test('an empty day has no coverage', () {
    expect(FiberDay.of(const []).enough, isFalse);
  });
}
