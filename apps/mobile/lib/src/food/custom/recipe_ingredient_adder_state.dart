import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../../food_packs/food_catalog_provider.dart';
import '../../format/parse_number.dart';
import '../../ui/mm_button.dart';
import '../../ui/mm_button_kind.dart';
import '../../ui/mm_list_row.dart';
import '../../ui/mm_text_field.dart';
import '../../ui/mm_text_field_kind.dart';
import 'recipe_ingredient_adder.dart';

class RecipeIngredientAdderState extends ConsumerState<RecipeIngredientAdder> {
  final _query = TextEditingController();
  final _grams = TextEditingController();
  final _name = TextEditingController();
  final _kcal = TextEditingController();
  final _protein = TextEditingController();
  final _carbs = TextEditingController();
  final _fat = TextEditingController();
  CatalogFood? _picked;
  var _byNumbers = false;

  @override
  void dispose() {
    for (final c in [_query, _grams, _name, _kcal, _protein, _carbs, _fat]) {
      c.dispose();
    }
    super.dispose();
  }

  RecipeIngredient? get _line {
    if (_byNumbers) {
      final kcal = parseNumber(_kcal.text);
      final name = _name.text.trim();
      if (name.isEmpty || kcal == null || kcal < 0) return null;
      final grams = parseNumber(_grams.text);
      return RecipeIngredient(
        name: name,
        grams: grams != null && grams > 0 ? grams : null,
        totals: NutritionTotals(
          kcal: kcal,
          proteinG: parseNumber(_protein.text) ?? 0,
          carbsG: parseNumber(_carbs.text) ?? 0,
          fatG: parseNumber(_fat.text) ?? 0,
        ),
      );
    }
    final food = _picked;
    final grams = parseNumber(_grams.text);
    if (food == null || grams == null || grams <= 0) return null;
    return RecipeIngredient(
      name: food.brand == null ? food.name : '${food.name} (${food.brand})',
      grams: grams,
      totals: NutritionTotals(
        kcal: food.kcal,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
      ).times(grams / 100),
    );
  }

  void _add() {
    final line = _line;
    if (line == null) return;
    widget.onAdd(line);
    setState(() {
      _picked = null;
      for (final c in [_query, _grams, _name, _kcal, _protein, _carbs, _fat]) {
        c.clear();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final catalog = ref.watch(foodCatalogProvider).value;
    final query = _query.text.trim();
    final hits = !_byNumbers && _picked == null && query.isNotEmpty
        ? catalog?.search(query, limit: 5) ?? const <SearchHit>[]
        : const <SearchHit>[];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Add an ingredient', style: text.labelLarge),
        const SizedBox(height: 4),
        if (_byNumbers) ...[
          MmTextField(
            key: const ValueKey('ingredient-name'),
            controller: _name,
            label: 'Ingredient',
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              for (final (c, label, key) in [
                (_kcal, 'kcal', 'kcal'),
                (_protein, 'Protein g', 'protein'),
                (_carbs, 'Carbs g', 'carbs'),
                (_fat, 'Fat g', 'fat'),
              ]) ...[
                Expanded(
                  child: MmTextField(
                    key: ValueKey('ingredient-$key'),
                    controller: c,
                    label: label,
                    kind: MmTextFieldKind.number,
                    dense: true,
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 6),
              ],
            ],
          ),
          Text(
            'Totals for the amount you put in the pot.',
            style: text.bodySmall,
          ),
        ] else ...[
          if (_picked == null)
            MmTextField(
              key: const ValueKey('ingredient-search'),
              controller: _query,
              label: 'Search foods',
              onChanged: (_) => setState(() {}),
            )
          else
            MmListRow(
              title: _picked!.name,
              subtitle: '${_picked!.kcal.round()} kcal per 100 g',
              trailing: MmButton(
                label: 'Change',
                kind: MmButtonKind.text,
                onPressed: () => setState(() => _picked = null),
              ),
            ),
          for (final hit in hits)
            MmListRow(
              key: ValueKey('ingredient-hit-${hit.food.id}'),
              title: hit.food.name,
              subtitle: '${hit.food.kcal.round()} kcal per 100 g',
              onTap: () => setState(() => _picked = hit.food),
            ),
        ],
        const SizedBox(height: 8),
        MmTextField(
          key: const ValueKey('ingredient-grams'),
          controller: _grams,
          label: _byNumbers ? 'Weight g (optional)' : 'Weight g',
          kind: MmTextFieldKind.number,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            MmButton(
              key: const ValueKey('ingredient-add'),
              label: 'Add',
              kind: MmButtonKind.secondary,
              onPressed: _line == null ? null : _add,
            ),
            MmButton(
              label: _byNumbers ? 'Search instead' : 'Enter numbers instead',
              kind: MmButtonKind.text,
              onPressed: () => setState(() => _byNumbers = !_byNumbers),
            ),
          ],
        ),
      ],
    );
  }
}
