import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format.dart';
import '../providers.dart';
import '../repository_role_providers.dart';

/// Logs one food by its macros. Recent foods refill the form in one tap.
/// (Database search and barcode scanning arrive with the food pack.)
class AddFoodSheet extends ConsumerStatefulWidget {
  const AddFoodSheet({required this.day, super.key});

  final CalendarDate day;

  @override
  ConsumerState<AddFoodSheet> createState() => _AddFoodSheetState();
}

class _AddFoodSheetState extends ConsumerState<AddFoodSheet> {
  final _name = TextEditingController();
  final _kcal = TextEditingController();
  final _protein = TextEditingController();
  final _carbs = TextEditingController();
  final _fat = TextEditingController();
  late Meal _meal = _defaultMeal();
  var _source = QuantitySource.labelServing;

  @override
  void dispose() {
    for (final c in [_name, _kcal, _protein, _carbs, _fat]) {
      c.dispose();
    }
    super.dispose();
  }

  static Meal _defaultMeal() => switch (DateTime.now().hour) {
    < 11 => Meal.breakfast,
    < 15 => Meal.lunch,
    < 21 => Meal.dinner,
    _ => Meal.snack,
  };

  double get _p => parseNumber(_protein.text) ?? 0;
  double get _c => parseNumber(_carbs.text) ?? 0;
  double get _f => parseNumber(_fat.text) ?? 0;
  double get _fromMacros => atwaterKcal(proteinG: _p, carbsG: _c, fatG: _f);

  /// Calories as typed, or derived from macros when left blank.
  double? get _energy {
    final typed = parseNumber(_kcal.text);
    if (typed != null) return typed;
    return _fromMacros > 0 ? _fromMacros : null;
  }

  bool get _valid {
    final energy = _energy;
    return _name.text.trim().isNotEmpty &&
        energy != null &&
        energy > 0 &&
        _p >= 0 &&
        _c >= 0 &&
        _f >= 0;
  }

  bool get _mismatch {
    final typed = parseNumber(_kcal.text);
    if (typed == null || _fromMacros == 0) return false;
    return !macrosMatchEnergy(kcal: typed, proteinG: _p, carbsG: _c, fatG: _f);
  }

  void _fill(FoodEntry e) => setState(() {
    String n(double v) =>
        v == v.roundToDouble() ? v.round().toString() : v.toStringAsFixed(1);
    _name.text = e.name;
    _kcal.text = n(e.kcal);
    _protein.text = n(e.proteinG);
    _carbs.text = n(e.carbsG);
    _fat.text = n(e.fatG);
    _source = e.source;
  });

  Future<void> _save() async {
    await ref
        .read(foodEntryWriterProvider)
        .addFood(
          FoodEntry(
            id: 0,
            date: widget.day,
            meal: _meal,
            name: _name.text.trim(),
            kcal: _energy!,
            proteinG: _p,
            carbsG: _c,
            fatG: _f,
            source: _source,
          ),
        );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final recents = ref.watch(recentFoodsProvider).value ?? const [];

    Widget number(TextEditingController c, String label, String key) =>
        Expanded(
          child: TextField(
            key: ValueKey('food-$key'),
            controller: c,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: label, isDense: true),
            onChanged: (_) => setState(() {}),
          ),
        );

    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        16,
        16,
        16 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Add food', style: text.titleLarge),
            if (recents.isNotEmpty) ...[
              const SizedBox(height: 12),
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: recents.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => ActionChip(
                    label: Text(recents[i].name),
                    onPressed: () => _fill(recents[i]),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            TextField(
              key: const ValueKey('food-name'),
              controller: _name,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Food'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                number(_protein, 'Protein g', 'protein'),
                const SizedBox(width: 8),
                number(_carbs, 'Carbs g', 'carbs'),
                const SizedBox(width: 8),
                number(_fat, 'Fat g', 'fat'),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              key: const ValueKey('food-kcal'),
              controller: _kcal,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: InputDecoration(
                labelText: 'Calories',
                hintText: _fromMacros > 0
                    ? '${_fromMacros.round()} from macros'
                    : null,
                helperText: _mismatch
                    ? 'Macros add up to ${_fromMacros.round()} kcal. '
                          'Double-check the label.'
                    : 'Leave blank to calculate from macros.',
                helperStyle: _mismatch
                    ? TextStyle(color: Theme.of(context).colorScheme.error)
                    : null,
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              children: [
                for (final meal in Meal.values)
                  ChoiceChip(
                    label: Text(meal.label),
                    selected: _meal == meal,
                    onSelected: (_) => setState(() => _meal = meal),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text('How was it measured?', style: text.labelLarge),
            const SizedBox(height: 4),
            Wrap(
              spacing: 8,
              children: [
                for (final source in QuantitySource.values)
                  ChoiceChip(
                    label: Text(source.label),
                    selected: _source == source,
                    onSelected: (_) => setState(() => _source = source),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                key: const ValueKey('food-save'),
                onPressed: _valid ? _save : null,
                child: const Text('Log it'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
