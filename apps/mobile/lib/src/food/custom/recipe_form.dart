import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'recipe_form_state.dart';

/// Define a recipe: its ingredients, how many servings it makes, and
/// optionally the cooked weight of the whole pot (MM-45). One serving is the
/// summed ingredients divided by the servings.
class RecipeForm extends ConsumerStatefulWidget {
  const RecipeForm({required this.onDone, this.recipe, super.key});

  /// The recipe being edited, or null for a new one.
  final CustomFood? recipe;
  final VoidCallback onDone;

  @override
  ConsumerState<RecipeForm> createState() => RecipeFormState();
}
