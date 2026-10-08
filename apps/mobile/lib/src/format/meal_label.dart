import 'package:mm_domain/mm_domain.dart';

extension MealLabel on Meal {
  String get label => switch (this) {
    Meal.breakfast => 'Breakfast',
    Meal.lunch => 'Lunch',
    Meal.dinner => 'Dinner',
    Meal.snack => 'Snacks',
  };
}
