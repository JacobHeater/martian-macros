import 'package:mm_domain/mm_domain.dart';

extension MealKindLabel on MealKind {
  String get shortLabel => switch (this) {
    MealKind.balanced => 'Balanced',
    MealKind.mostlyCarbohydrate => 'Mostly carbs',
    MealKind.mostlyProtein => 'Mostly protein',
    MealKind.rich => 'Rich',
  };

  String get label => switch (this) {
    MealKind.balanced => 'Balanced',
    MealKind.mostlyCarbohydrate => 'Mostly carbs (pasta, rice, pizza)',
    MealKind.mostlyProtein => 'Mostly protein (meat or fish)',
    MealKind.rich => 'Rich (fried, creamy, dessert)',
  };
}
