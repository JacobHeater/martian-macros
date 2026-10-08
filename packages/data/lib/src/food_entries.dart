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
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}
