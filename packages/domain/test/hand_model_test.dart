import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// MM-46: hand portions become grams of the chosen food.
void main() {
  const man = HandSize(heightCm: 190, sex: BiologicalSex.male);
  const woman = HandSize(heightCm: 155, sex: BiologicalSex.female);
  const chicken = ReferenceNutrition(
    basis: ReferenceBasis.per100g,
    nutrition: NutritionTotals(kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6),
  );

  test('the hand matters: a taller man logs more than a shorter woman', () {
    final his = gramsFor(1, PortionUnit.palm, chicken, hand: man)!;
    final hers = gramsFor(1, PortionUnit.palm, chicken, hand: woman)!;
    expect(his, greaterThan(hers));
    expect(his, inInclusiveRange(100, 170));
    expect(hers, inInclusiveRange(55, 90));
  });

  test('a reference person gets the reference portion', () {
    const ref = HandSize(heightCm: 178, sex: BiologicalSex.male);
    expect(HandModel.millilitersOf(PortionUnit.palm, ref), closeTo(110, 1e-9));
  });

  test('the food matters: its own density wins over the default', () {
    const dense = ReferenceNutrition(
      basis: ReferenceBasis.per100g,
      nutrition: NutritionTotals(kcal: 100, proteinG: 10, carbsG: 10, fatG: 1),
      densityGPerMl: 1.3,
    );
    expect(
      gramsFor(1, PortionUnit.palm, dense, hand: man)!,
      greaterThan(gramsFor(1, PortionUnit.palm, chicken, hand: man)!),
    );
  });

  test('without a hand size a hand portion cannot be converted', () {
    expect(gramsFor(1, PortionUnit.palm, chicken), isNull);
    expect(scaleNutrition(1, PortionUnit.palm, chicken), isNull);
  });

  test('nutrition scales from the grams the hand implies', () {
    final grams = gramsFor(2, PortionUnit.palm, chicken, hand: man)!;
    final totals = scaleNutrition(2, PortionUnit.palm, chicken, hand: man)!;
    expect(totals.kcal, closeTo(165 * grams / 100, 1e-9));
    expect(totals.proteinG, closeTo(31 * grams / 100, 1e-9));
  });

  test('non-hand units are not affected', () {
    expect(HandModel.gramsOf(PortionUnit.gram, man), isNull);
    expect(gramsFor(100, PortionUnit.gram, chicken, hand: man), 100);
  });
}
