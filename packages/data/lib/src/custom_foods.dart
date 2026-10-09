import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

/// Foods and recipes the user defined (MM-45). Numbers are per serving.
@DataClassName('CustomFoodRow')
class CustomFoods extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text()();
  TextColumn get kind => textEnum<CustomFoodKind>()();
  TextColumn get servingDescription => text()();
  RealColumn get servingGrams =>
      real().nullable().check(servingGrams.isBiggerThanValue(0))();
  RealColumn get kcal => real().check(kcal.isBiggerOrEqualValue(0))();
  RealColumn get proteinG => real().check(proteinG.isBiggerOrEqualValue(0))();
  RealColumn get carbsG => real().check(carbsG.isBiggerOrEqualValue(0))();
  RealColumn get fatG => real().check(fatG.isBiggerOrEqualValue(0))();
  TextColumn get barcode => text().nullable()();
  RealColumn get servings => real().nullable()();
  RealColumn get cookedWeightGrams => real().nullable()();
}
