import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// The portion of a stored food row, or null for an entry logged before
/// portions were recorded (MM-167). Nothing is invented for such an entry.
Portion? portionFromRow(FoodRow r) {
  final basis = r.nutritionBasis;
  if (basis == null) return null;
  final refBasis = r.referenceBasis;
  final originPackId = r.originPackId;
  final originFoodId = r.originFoodId;
  final originSource = r.originSource;
  final kcal = r.referenceKcal;
  final protein = r.referenceProteinG;
  final carbs = r.referenceCarbsG;
  final fat = r.referenceFatG;
  final reference =
      refBasis == null ||
          kcal == null ||
          protein == null ||
          carbs == null ||
          fat == null
      ? null
      : ReferenceNutrition(
          basis: refBasis,
          nutrition: NutritionTotals(
            kcal: kcal,
            proteinG: protein,
            carbsG: carbs,
            fatG: fat,
          ),
          servingDescription: r.servingDescription,
          servingGrams: r.servingGrams,
          servingMilliliters: r.servingMilliliters,
          servingUnit: r.servingUnit,
          densityGPerMl: r.densityGPerMl,
        );
  return Portion(
    method: r.quantitySource,
    basis: basis,
    quantity: r.portionQuantity,
    unit: r.portionUnit,
    reference: reference,
    origin: originPackId == null || originFoodId == null || originSource == null
        ? null
        : FoodOrigin(
            packId: originPackId,
            foodId: originFoodId,
            source: originSource,
            sourceId: r.originSourceId,
          ),
  );
}

/// [row] with the portion columns set from [portion]: all null for no portion.
FoodEntriesCompanion withPortion(FoodEntriesCompanion row, Portion? portion) {
  final reference = portion?.reference;
  return row.copyWith(
    portionQuantity: Value(portion?.quantity),
    portionUnit: Value(portion?.unit),
    nutritionBasis: Value(portion?.basis),
    referenceBasis: Value(reference?.basis),
    referenceKcal: Value(reference?.nutrition.kcal),
    referenceProteinG: Value(reference?.nutrition.proteinG),
    referenceCarbsG: Value(reference?.nutrition.carbsG),
    referenceFatG: Value(reference?.nutrition.fatG),
    servingDescription: Value(reference?.servingDescription),
    servingGrams: Value(reference?.servingGrams),
    servingMilliliters: Value(reference?.servingMilliliters),
    servingUnit: Value(reference?.servingUnit),
    densityGPerMl: Value(reference?.densityGPerMl),
    originPackId: Value(portion?.origin?.packId),
    originFoodId: Value(portion?.origin?.foodId),
    originSource: Value(portion?.origin?.source),
    originSourceId: Value(portion?.origin?.sourceId),
  );
}
