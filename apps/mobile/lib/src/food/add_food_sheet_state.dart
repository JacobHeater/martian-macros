import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../format/fmt.dart';
import '../format/meal_label.dart';
import '../format/parse_number.dart';
import '../format/quantity_source_label.dart';
import '../food_packs/food_catalog_provider.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/day_stepper.dart';
import '../ui/mm_action_chip.dart';
import '../ui/mm_button.dart';
import '../ui/mm_choice_chip.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import '../ui/mm_list_row.dart';
import 'add_food_sheet.dart';
import 'food_amount_step.dart';
import 'food_search_results.dart';

class AddFoodSheetState extends ConsumerState<AddFoodSheet> {
  final _search = TextEditingController();
  CatalogFood? _picked;
  final _name = TextEditingController();
  final _kcal = TextEditingController();
  final _protein = TextEditingController();
  final _carbs = TextEditingController();
  final _fat = TextEditingController();
  late Meal _meal = widget.entry?.meal ?? widget.meal ?? _defaultMeal();
  late CalendarDate _day = widget.entry?.date ?? widget.day;
  var _source = QuantitySource.labelServing;

  @override
  void initState() {
    super.initState();
    final entry = widget.entry;
    if (entry != null) {
      _fill(entry);
      _search.clear();
    }
  }

  @override
  void dispose() {
    for (final c in [_search, _name, _kcal, _protein, _carbs, _fat]) {
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
    _search.clear();
  });

  Future<void> _save() async {
    final editing = widget.entry;
    final entry = FoodEntry(
      id: editing?.id ?? 0,
      date: _day,
      meal: _meal,
      name: _name.text.trim(),
      kcal: _energy!,
      proteinG: _p,
      carbsG: _c,
      fatG: _f,
      source: _source,
    );
    final writer = ref.read(foodEntryWriterProvider);
    await (editing == null ? writer.addFood(entry) : writer.updateFood(entry));
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final recents = ref.watch(recentFoodsProvider).value ?? const [];
    final editing = widget.entry != null;
    final query = _search.text.trim();
    final picked = _picked;
    if (picked != null) {
      return _sheet(
        FoodAmountStep(
          food: picked,
          servings:
              ref.watch(foodCatalogProvider).value?.servingsOf(picked) ??
              const [],
          day: widget.day,
          meal: _meal,
          onBack: () => setState(() => _picked = null),
        ),
      );
    }
    final matchingRecents = query.isEmpty
        ? const <FoodEntry>[]
        : recents
              .where((e) => e.name.toLowerCase().contains(query.toLowerCase()))
              .toList();

    Widget number(TextEditingController c, String label, String key) =>
        Expanded(
          child: MmTextField(
            key: ValueKey('food-$key'),
            controller: c,
            label: label,
            kind: MmTextFieldKind.number,
            dense: true,
            onChanged: (_) => setState(() {}),
          ),
        );

    return _sheet(
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(editing ? 'Edit food' : 'Add food', style: text.titleLarge),
          const SizedBox(height: 12),
          if (!editing)
            MmTextField(
              key: const ValueKey('food-search'),
              controller: _search,
              label: 'Search foods',
              onChanged: (_) => setState(() {}),
            ),
          if (editing)
            DayStepper(
              label: Fmt.day(_day, ref.watch(todayProvider)),
              onPrevious: () => setState(() => _day = _day.addDays(-1)),
              onNext: _day.isBefore(ref.watch(todayProvider))
                  ? () => setState(() => _day = _day.addDays(1))
                  : null,
              onLabelTap: null,
            ),
          if (!editing && query.isNotEmpty) ...[
            for (final e in matchingRecents)
              MmListRow(
                title: e.name,
                subtitle: 'Your recent food · ${e.kcal.round()} kcal',
                onTap: () => _fill(e),
              ),
            FoodSearchResults(
              query: query,
              onPick: (food) => setState(() => _picked = food),
              onEnterManually: () => setState(() {
                _name.text = query;
                _search.clear();
              }),
            ),
          ] else ...[
            if (!editing && recents.isNotEmpty) ...[
              const SizedBox(height: 12),
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: recents.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => MmActionChip(
                    label: recents[i].name,
                    onPressed: () => _fill(recents[i]),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            MmTextField(
              key: const ValueKey('food-name'),
              controller: _name,
              label: 'Food',
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
            MmTextField(
              key: const ValueKey('food-kcal'),
              controller: _kcal,
              label: 'Calories',
              kind: MmTextFieldKind.number,
              hint: _fromMacros > 0
                  ? '${_fromMacros.round()} from macros'
                  : null,
              helper: _mismatch
                  ? 'Macros add up to ${_fromMacros.round()} kcal. '
                        'Double-check the label.'
                  : 'Leave blank to calculate from macros.',
              helperIsWarning: _mismatch,
              onChanged: (_) => setState(() {}),
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
            const SizedBox(height: 12),
            Text('How was it measured?', style: text.labelLarge),
            const SizedBox(height: 4),
            Wrap(
              spacing: 8,
              children: [
                for (final source in QuantitySource.values)
                  MmChoiceChip(
                    label: source.label,
                    selected: _source == source,
                    onSelected: () => setState(() => _source = source),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            MmButton(
              key: const ValueKey('food-save'),
              label: editing ? 'Save changes' : 'Log it',
              expand: true,
              onPressed: _valid ? _save : null,
            ),
          ],
        ],
      ),
    );
  }

  Widget _sheet(Widget child) => Padding(
    padding: EdgeInsets.fromLTRB(
      16,
      16,
      16,
      16 + MediaQuery.viewInsetsOf(context).bottom,
    ),
    child: SingleChildScrollView(child: child),
  );
}
