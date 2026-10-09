import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../../format/fmt.dart';
import '../../format/quantity_text.dart';
import '../../repository_role_providers.dart';
import '../../ui/mm_button.dart';
import '../../ui/mm_button_kind.dart';
import '../../ui/mm_icon_button.dart';
import '../../ui/mm_list_row.dart';
import '../../ui/mm_text_field.dart';
import '../../ui/mm_text_field_kind.dart';
import 'recipe_form.dart';
import 'recipe_ingredient_adder.dart';

class RecipeFormState extends ConsumerState<RecipeForm> {
  final _name = TextEditingController();
  final _servings = TextEditingController(text: '4');
  final _cooked = TextEditingController();
  late List<RecipeIngredient> _ingredients;

  @override
  void initState() {
    super.initState();
    final r = widget.recipe;
    _ingredients = [...?r?.ingredients];
    if (r == null) return;
    _name.text = r.name;
    _servings.text = quantityText(r.servings ?? 1);
    _cooked.text = r.cookedWeightGrams == null
        ? ''
        : quantityText(r.cookedWeightGrams!);
  }

  @override
  void dispose() {
    for (final c in [_name, _servings, _cooked]) {
      c.dispose();
    }
    super.dispose();
  }

  double? get _servingCount => parseQuantity(_servings.text);

  double? get _cookedGrams => parseQuantity(_cooked.text);

  NutritionTotals? get _perServing {
    final servings = _servingCount;
    return servings == null ? null : recipePerServing(_ingredients, servings);
  }

  bool get _valid =>
      _name.text.trim().isNotEmpty &&
      _ingredients.isNotEmpty &&
      (_perServing?.kcal ?? 0) > 0;

  Future<void> _save() async {
    final servings = _servingCount!;
    await ref
        .read(customFoodWriterProvider)
        .saveCustomFood(
          CustomFood(
            id: widget.recipe?.id ?? 0,
            name: _name.text.trim(),
            kind: CustomFoodKind.recipe,
            servingDescription: '1 serving',
            servingGrams: recipeServingGrams(_cookedGrams, servings),
            perServing: _perServing!,
            servings: servings,
            cookedWeightGrams: _cookedGrams,
            ingredients: _ingredients,
          ),
        );
    if (mounted) widget.onDone();
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final per = _perServing;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.recipe == null ? 'Save a recipe' : 'Edit your recipe',
          style: text.titleLarge,
        ),
        const SizedBox(height: 12),
        MmTextField(
          key: const ValueKey('recipe-name'),
          controller: _name,
          label: 'Name',
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: MmTextField(
                key: const ValueKey('recipe-servings'),
                controller: _servings,
                label: 'Makes servings',
                kind: MmTextFieldKind.quantity,
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: MmTextField(
                key: const ValueKey('recipe-cooked'),
                controller: _cooked,
                label: 'Cooked weight g',
                kind: MmTextFieldKind.number,
                onChanged: (_) => setState(() {}),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Optional: weigh the whole pot once it is cooked, so a serving can '
          'be logged by weight. Raw weights are not used, because cooking '
          'changes weight and not energy.',
          style: text.bodySmall,
        ),
        const SizedBox(height: 12),
        for (var i = 0; i < _ingredients.length; i++)
          MmListRow(
            key: ValueKey('recipe-line-$i'),
            title: _ingredients[i].name,
            subtitle:
                '${_ingredients[i].grams == null ? '' : '${quantityText(_ingredients[i].grams!)} g · '}'
                '${Fmt.kcal(_ingredients[i].totals.kcal)}',
            trailing: MmIconButton(
              tooltip: 'Remove ${_ingredients[i].name}',
              icon: Icons.close,
              onPressed: () => setState(() => _ingredients.removeAt(i)),
            ),
          ),
        RecipeIngredientAdder(
          onAdd: (line) => setState(() => _ingredients.add(line)),
        ),
        const SizedBox(height: 12),
        Text(
          per == null || _ingredients.isEmpty
              ? 'Add ingredients to see one serving.'
              : 'One serving: ${Fmt.kcal(per.kcal)} · ${per.proteinG.round()} g '
                    'protein · ${per.carbsG.round()} g carbs · '
                    '${per.fatG.round()} g fat',
          key: const ValueKey('recipe-per-serving'),
          style: text.titleMedium,
        ),
        const SizedBox(height: 16),
        MmButton(
          key: const ValueKey('recipe-save'),
          label: 'Save recipe',
          expand: true,
          onPressed: _valid ? _save : null,
        ),
        MmButton(
          label: 'Cancel',
          kind: MmButtonKind.text,
          onPressed: widget.onDone,
        ),
      ],
    );
  }
}
