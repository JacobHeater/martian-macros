import 'package:mm_domain/mm_domain.dart';

extension MealSizeLabel on MealSize {
  String get label => switch (this) {
    MealSize.light => 'Light',
    MealSize.regular => 'Regular',
    MealSize.large => 'Large',
    MealSize.veryLarge => 'Very large',
  };
}
