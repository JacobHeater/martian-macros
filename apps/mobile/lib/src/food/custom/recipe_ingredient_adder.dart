import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'recipe_ingredient_adder_state.dart';

/// Adds one line to a recipe (MM-45): a food found by search and a weight, or
/// a name and the totals typed in. Calls [onAdd] with the line and clears.
class RecipeIngredientAdder extends ConsumerStatefulWidget {
  const RecipeIngredientAdder({required this.onAdd, super.key});

  final ValueChanged<RecipeIngredient> onAdd;

  @override
  ConsumerState<RecipeIngredientAdder> createState() =>
      RecipeIngredientAdderState();
}
