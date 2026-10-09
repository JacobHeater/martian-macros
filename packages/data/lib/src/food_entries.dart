import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

@DataClassName('FoodRow')
class FoodEntries extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get epochDay => integer()();
  TextColumn get meal => textEnum<Meal>()();
  TextColumn get name => text()();
  RealColumn get kcal => real().check(kcal.isBiggerOrEqualValue(0))();
  RealColumn get proteinG => real().check(proteinG.isBiggerOrEqualValue(0))();
  RealColumn get carbsG => real().check(carbsG.isBiggerOrEqualValue(0))();
  RealColumn get fatG => real().check(fatG.isBiggerOrEqualValue(0))();
  TextColumn get quantitySource => textEnum<QuantitySource>()();
  // MM-167: how much was eaten and what the totals are for. All null for an
  // entry logged before they were recorded; `nutritionBasis` null means no
  // portion. The reference columns are set only for a calculated entry.
  RealColumn get portionQuantity =>
      real().nullable().check(portionQuantity.isBiggerThanValue(0))();
  TextColumn get portionUnit => textEnum<PortionUnit>().nullable()();
  TextColumn get nutritionBasis => textEnum<NutritionBasis>().nullable()();
  TextColumn get referenceBasis => textEnum<ReferenceBasis>().nullable()();
  RealColumn get referenceKcal => real().nullable()();
  RealColumn get referenceProteinG => real().nullable()();
  RealColumn get referenceCarbsG => real().nullable()();
  RealColumn get referenceFatG => real().nullable()();
  TextColumn get servingDescription => text().nullable()();
  RealColumn get servingGrams => real().nullable()();
  RealColumn get servingMilliliters => real().nullable()();
  TextColumn get servingUnit => textEnum<PortionUnit>().nullable()();
  RealColumn get densityGPerMl => real().nullable()();
  // MM-167: the food an entry was logged from, when it came from a pack or
  // a saved food.
  TextColumn get originPackId => text().nullable()();
  IntColumn get originFoodId => integer().nullable()();
  TextColumn get originSource => text().nullable()();
  TextColumn get originSourceId => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}
