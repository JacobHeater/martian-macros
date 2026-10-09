import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../format/meal_label.dart';
import '../format/parse_number.dart';
import '../format/rounded_to_zero_note.dart';
import '../repository_role_providers.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_choice_chip.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import 'food_amount_step.dart';
import 'food_trust_mark.dart';

class FoodAmountStepState extends ConsumerState<FoodAmountStep> {
  final _quantity = TextEditingController();

  /// The chosen serving, or null for grams.
  late CatalogServing? _serving = widget.servings.firstOrNull;
  late Meal _meal = widget.meal;

  @override
  void initState() {
    super.initState();
    _quantity.text = _serving == null ? '100' : '1';
  }

  @override
  void dispose() {
    _quantity.dispose();
    super.dispose();
  }

  double get _grams {
    final q = parseNumber(_quantity.text) ?? 0;
    return q * (_serving?.grams ?? 1);
  }

  double _per(double per100) => per100 * _grams / 100;

  String _n(double v) => v.round().toString();

  Future<void> _log() async {
    final food = widget.food;
    await ref
        .read(foodEntryWriterProvider)
        .addFood(
          FoodEntry(
            id: 0,
            date: widget.day,
            meal: _meal,
            name: food.brand == null
                ? food.name
                : '${food.name} (${food.brand})',
            kcal: _per(food.kcal),
            proteinG: _per(food.proteinG),
            carbsG: _per(food.carbsG),
            fatG: _per(food.fatG),
            source: _serving == null
                ? QuantitySource.weighed
                : QuantitySource.householdMeasure,
          ),
        );
    if (mounted) Navigator.of(context).pop();
  }

  void _pick(CatalogServing? serving) => setState(() {
    _serving = serving;
    _quantity.text = serving == null ? '100' : '1';
  });

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final food = widget.food;
    final grams = _grams;
    final note = roundedToZeroNote(
      food,
      _serving ??
          CatalogServing(description: 'grams', grams: grams > 0 ? grams : 100),
    );
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(food.name, style: text.titleLarge),
        if (food.brand != null) Text(food.brand!, style: text.bodyMedium),
        const SizedBox(height: 4),
        FoodTrustMark(food: food),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          children: [
            for (final s in widget.servings)
              MmChoiceChip(
                label: '${s.description} (${s.grams.round()} g)',
                selected: _serving == s,
                onSelected: () => _pick(s),
              ),
            MmChoiceChip(
              label: 'Grams',
              selected: _serving == null,
              onSelected: () => _pick(null),
            ),
          ],
        ),
        const SizedBox(height: 12),
        MmTextField(
          key: const ValueKey('amount-quantity'),
          controller: _quantity,
          label: _serving == null ? 'Grams' : 'How many',
          kind: MmTextFieldKind.number,
          helper: _serving == null ? null : '${_n(grams)} g',
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 12),
        Text(
          '${_n(_per(food.kcal))} kcal · '
          '${_n(_per(food.proteinG))} g protein · '
          '${_n(_per(food.carbsG))} g carbs · '
          '${_n(_per(food.fatG))} g fat',
          key: const ValueKey('amount-macros'),
          style: text.titleMedium,
        ),
        if (note != null) ...[
          const SizedBox(height: 8),
          Notice(kind: NoticeKind.info, text: note),
        ],
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          children: [
            for (final meal in Meal.values)
              MmChoiceChip(
                label: meal.label,
                selected: _meal == meal,
                onSelected: () => setState(() => _meal = meal),
              ),
          ],
        ),
        const SizedBox(height: 16),
        MmButton(
          key: const ValueKey('amount-log'),
          label: 'Log it',
          expand: true,
          onPressed: grams > 0 ? _log : null,
        ),
        MmButton(
          label: 'Back to search',
          kind: MmButtonKind.text,
          onPressed: widget.onBack,
        ),
      ],
    );
  }
}
