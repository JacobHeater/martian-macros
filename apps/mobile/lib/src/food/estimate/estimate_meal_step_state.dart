import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../../format/fmt.dart';
import '../../format/meal_label.dart';
import '../../providers.dart';
import '../../repository_role_providers.dart';
import '../../ui/mm_button.dart';
import '../../ui/mm_button_kind.dart';
import '../../ui/mm_choice_chip.dart';
import '../../ui/mm_text_field.dart';
import '../../ui/notice.dart';
import 'estimate_meal_step.dart';
import 'meal_kind_label.dart';
import 'meal_size_label.dart';

class EstimateMealStepState extends ConsumerState<EstimateMealStep> {
  final _name = TextEditingController();
  var _size = MealSize.regular;
  var _kind = MealKind.balanced;
  late Meal _meal = widget.meal;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _log(double maintenance) async {
    final totals = estimateMeal(_size, _kind, maintenanceKcal: maintenance);
    final typed = _name.text.trim();
    await ref
        .read(foodEntryWriterProvider)
        .addFood(
          FoodEntry(
            id: 0,
            date: widget.day,
            meal: _meal,
            name: typed.isEmpty
                ? 'Estimated meal (${_size.label.toLowerCase()}, '
                      '${_kind.shortLabel.toLowerCase()})'
                : typed,
            kcal: totals.kcal,
            proteinG: totals.proteinG,
            carbsG: totals.carbsG,
            fatG: totals.fatG,
            source: QuantitySource.quickAdd,
            portion: const Portion(
              method: QuantitySource.quickAdd,
              basis: NutritionBasis.enteredTotals,
            ),
          ),
        );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final maintenance = ref.watch(coachProvider)?.tdee.kcal;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Estimate a meal', style: text.titleLarge),
        const SizedBox(height: 4),
        Text(
          'For a restaurant, a friend’s cooking or a buffet. Restaurant meals '
          'usually have more than they look. A rough entry beats a missing '
          'one.',
          style: text.bodySmall,
        ),
        const SizedBox(height: 16),
        Text('How big was it?', style: text.labelLarge),
        const SizedBox(height: 4),
        if (maintenance == null)
          const Notice(
            text:
                'Sizes are scaled to your own energy needs, which the app '
                'works out after your first weigh-in. Until then, enter the '
                'food by hand.',
          )
        else
          Wrap(
            spacing: 8,
            children: [
              for (final size in MealSize.values)
                MmChoiceChip(
                  label:
                      '${size.label} · about '
                      '${Fmt.whole(mealKcal(size, maintenance))} kcal',
                  selected: _size == size,
                  onSelected: () => setState(() => _size = size),
                ),
            ],
          ),
        const SizedBox(height: 16),
        Text('What kind of meal?', style: text.labelLarge),
        const SizedBox(height: 4),
        Wrap(
          spacing: 8,
          children: [
            for (final kind in MealKind.values)
              MmChoiceChip(
                label: kind.label,
                selected: _kind == kind,
                onSelected: () => setState(() => _kind = kind),
              ),
          ],
        ),
        const SizedBox(height: 16),
        MmTextField(
          key: const ValueKey('estimate-name'),
          controller: _name,
          label: 'Name (optional)',
          hint: 'Thai place, usual',
        ),
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
          key: const ValueKey('estimate-log'),
          label: 'Log the estimate',
          expand: true,
          onPressed: maintenance == null ? null : () => _log(maintenance),
        ),
        MmButton(
          label: 'Back',
          kind: MmButtonKind.text,
          onPressed: widget.onBack,
        ),
      ],
    );
  }
}
