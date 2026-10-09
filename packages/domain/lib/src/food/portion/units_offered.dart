import '../../quantity_source.dart';
import 'portion_unit.dart';
import 'reference_nutrition.dart';

const _volumeUnits = [
  PortionUnit.cup,
  PortionUnit.tablespoon,
  PortionUnit.teaspoon,
  PortionUnit.milliliter,
];

/// The units a person may choose under [method] for a food with [reference]
/// (MM-167), in the order to offer them. Empty means the method has no
/// quantity (an Estimate), or the food has no honest conversion for it.
///
/// Volume units are offered for a calculated entry only when the food can
/// convert them: a density, or a serving defined in both volume and weight.
/// With no [reference] (typed totals) they are descriptive and always offered.
/// Hand portions are counts and are always offered; they carry no exact
/// conversion.
List<PortionUnit> unitsOffered(
  QuantitySource method, {
  ReferenceNutrition? reference,
}) {
  switch (method) {
    case QuantitySource.weighed:
      return const [PortionUnit.gram, PortionUnit.ounce];
    case QuantitySource.labelServing:
      return const [PortionUnit.serving];
    case QuantitySource.householdMeasure:
      if (reference == null) return _volumeUnits;
      final convertible =
          reference.densityGPerMl != null ||
          (reference.servingMilliliters != null &&
              reference.servingGrams != null);
      return convertible ? _volumeUnits : const [];
    case QuantitySource.palm:
      return const [PortionUnit.palm];
    case QuantitySource.cuppedHand:
      return const [PortionUnit.cuppedHand];
    case QuantitySource.thumb:
      return const [PortionUnit.thumb];
    case QuantitySource.quickAdd:
      return const [];
  }
}
