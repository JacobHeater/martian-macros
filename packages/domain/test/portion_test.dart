import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// MM-167: quantities, units and scaling. Pure functions; no UI.
void main() {
  const per100g = ReferenceNutrition(
    basis: ReferenceBasis.per100g,
    nutrition: NutritionTotals(kcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2),
  );

  group('parseQuantity', () {
    test('decimals and simple fractions', () {
      expect(parseQuantity('1.5'), 1.5);
      expect(parseQuantity('0.5'), 0.5);
      expect(parseQuantity('.5'), 0.5);
      expect(parseQuantity('1/2'), 0.5);
      expect(parseQuantity('1 1/2'), 1.5);
      expect(parseQuantity(' 2 '), 2);
      expect(parseQuantity('1,5'), 1.5);
    });

    test('empty, zero, negative and non-numeric are rejected', () {
      for (final bad in [
        '',
        '  ',
        '0',
        '0.0',
        '-2',
        'abc',
        '1/0',
        '1/',
        '1..2',
      ]) {
        expect(parseQuantity(bad), isNull, reason: '"$bad"');
      }
    });
  });

  group('units', () {
    test('ounces are weight, fluid ounces are volume', () {
      expect(PortionUnit.ounce.isWeight, isTrue);
      expect(PortionUnit.fluidOunce.isVolume, isTrue);
      expect(PortionUnit.fluidOunce.isWeight, isFalse);
      expect(gramsFor(6, PortionUnit.ounce, per100g), closeTo(170.1, 0.01));
      expect(gramsFor(1, PortionUnit.fluidOunce, per100g), isNull);
    });

    test('a cup is the US legal cup', () {
      expect(PortionUnit.cup.milliliters, closeTo(236.588, 0.001));
      expect(PortionUnit.tablespoon.milliliters, closeTo(14.787, 0.001));
      expect(PortionUnit.teaspoon.milliliters, closeTo(4.929, 0.001));
    });
  });

  group('scaleNutrition', () {
    test('150 g of a food stated per 100 g', () {
      final t = scaleNutrition(150, PortionUnit.gram, per100g)!;
      expect(t.kcal, closeTo(78, 1e-9));
      expect(t.proteinG, closeTo(0.45, 1e-9));
      expect(t.carbsG, closeTo(21, 1e-9));
      expect(t.fatG, closeTo(0.3, 1e-9));
    });

    test('1.5 label servings', () {
      const bar = ReferenceNutrition(
        basis: ReferenceBasis.perServing,
        nutrition: NutritionTotals(
          kcal: 160,
          proteinG: 10,
          carbsG: 15,
          fatG: 6,
        ),
        servingDescription: '1 bar',
        servingGrams: 40,
      );
      expect(scaleNutrition(1.5, PortionUnit.serving, bar)!.kcal, 240);
      expect(gramsFor(1.5, PortionUnit.serving, bar), 60);
      // 60 g is the same amount, reached by weight.
      expect(
        scaleNutrition(60, PortionUnit.gram, bar)!.kcal,
        closeTo(240, 1e-9),
      );
    });

    test('0.5 cup of a food with a serving defined in volume', () {
      const milk = ReferenceNutrition(
        basis: ReferenceBasis.perServing,
        nutrition: NutritionTotals(kcal: 200, proteinG: 8, carbsG: 12, fatG: 8),
        servingDescription: '1 cup (240 mL)',
        servingGrams: 245,
        servingMilliliters: 240,
        servingUnit: PortionUnit.cup,
      );
      // The source counts this serving in cups, so half a cup is half of it.
      final t = scaleNutrition(0.5, PortionUnit.cup, milk)!;
      expect(t.kcal, 100);
      expect(gramsFor(0.5, PortionUnit.cup, milk), 122.5);
      // A different volume unit goes through the serving's own millilitres.
      expect(
        scaleNutrition(1, PortionUnit.tablespoon, milk)!.kcal,
        closeTo(200 * 14.78676478125 / 240, 1e-9),
      );
    });

    test('a volume with no density and no volume serving does not convert', () {
      expect(scaleNutrition(1, PortionUnit.cup, per100g), isNull);
      const withDensity = ReferenceNutrition(
        basis: ReferenceBasis.per100g,
        nutrition: NutritionTotals(kcal: 100, proteinG: 0, carbsG: 25, fatG: 0),
        densityGPerMl: 1.0,
      );
      expect(
        scaleNutrition(1, PortionUnit.cup, withDensity)!.kcal,
        closeTo(236.588, 0.01),
      );
    });

    test('hand portions and non-positive amounts are not scaled', () {
      expect(scaleNutrition(2, PortionUnit.cuppedHand, per100g), isNull);
      expect(scaleNutrition(0, PortionUnit.gram, per100g), isNull);
      expect(scaleNutrition(-1, PortionUnit.gram, per100g), isNull);
      expect(scaleNutrition(double.nan, PortionUnit.gram, per100g), isNull);
    });

    test('per 100 mL references scale by volume', () {
      const juice = ReferenceNutrition(
        basis: ReferenceBasis.per100ml,
        nutrition: NutritionTotals(
          kcal: 45,
          proteinG: 0.5,
          carbsG: 10,
          fatG: 0,
        ),
      );
      expect(
        scaleNutrition(250, PortionUnit.milliliter, juice)!.kcal,
        closeTo(112.5, 1e-9),
      );
      expect(scaleNutrition(100, PortionUnit.gram, juice), isNull);
    });
  });

  group('unitsOffered', () {
    test('each method offers its own units; Estimate offers none', () {
      expect(unitsOffered(QuantitySource.weighed), [
        PortionUnit.gram,
        PortionUnit.ounce,
      ]);
      expect(unitsOffered(QuantitySource.labelServing), [PortionUnit.serving]);
      expect(unitsOffered(QuantitySource.palm), [PortionUnit.palm]);
      expect(unitsOffered(QuantitySource.cuppedHand), [PortionUnit.cuppedHand]);
      expect(unitsOffered(QuantitySource.thumb), [PortionUnit.thumb]);
      expect(unitsOffered(QuantitySource.quickAdd), isEmpty);
    });

    test('cup and spoon are offered only where the food can convert them', () {
      expect(
        unitsOffered(QuantitySource.householdMeasure, reference: per100g),
        isEmpty,
      );
      expect(
        unitsOffered(QuantitySource.householdMeasure),
        contains(PortionUnit.cup),
        reason: 'typed totals: the unit is only a description',
      );
      const dense = ReferenceNutrition(
        basis: ReferenceBasis.per100g,
        nutrition: NutritionTotals(kcal: 1, proteinG: 0, carbsG: 0, fatG: 0),
        densityGPerMl: 0.9,
      );
      expect(
        unitsOffered(QuantitySource.householdMeasure, reference: dense),
        contains(PortionUnit.tablespoon),
      );
    });
  });
}
