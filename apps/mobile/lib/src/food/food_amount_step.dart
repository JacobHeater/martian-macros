import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'food_amount_step_state.dart';

/// How much of a database food was eaten (MM-42): the food's own servings or
/// grams, with the macros updating as the amount changes. Logging records how
/// it was measured.
class FoodAmountStep extends ConsumerStatefulWidget {
  const FoodAmountStep({
    required this.food,
    required this.servings,
    required this.day,
    required this.meal,
    required this.onBack,
    super.key,
  });

  final CatalogFood food;
  final List<CatalogServing> servings;
  final CalendarDate day;
  final Meal meal;
  final VoidCallback onBack;

  @override
  ConsumerState<FoodAmountStep> createState() => FoodAmountStepState();
}
