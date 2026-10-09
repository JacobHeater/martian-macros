import 'package:drift/drift.dart';

/// The lines of a recipe, with the totals each had when it was written
/// (MM-45).
@DataClassName('RecipeIngredientRow')
class RecipeIngredients extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get recipeId => integer()();
  IntColumn get position => integer()();
  TextColumn get name => text()();
  RealColumn get grams => real().nullable()();
  RealColumn get kcal => real()();
  RealColumn get proteinG => real()();
  RealColumn get carbsG => real()();
  RealColumn get fatG => real()();
}
