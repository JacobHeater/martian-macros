import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../format/fmt.dart';
import '../format/meal_label.dart';
import '../format/parse_number.dart';
import '../format/portion_unit_label.dart';
import '../format/quantity_source_label.dart';
import '../format/quantity_text.dart';
import '../food_packs/food_catalog_provider.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/day_stepper.dart';
import '../ui/mm_action_chip.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_choice_chip.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import '../ui/mm_list_row.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/notice.dart';
import 'add_food_sheet.dart';
import 'custom/custom_catalog_food.dart';
import 'custom/my_foods_step.dart';
import 'estimate/estimate_meal_step.dart';
import 'food_amount_step.dart';
import 'food_search_results.dart';
import 'scan/barcode_scan_step.dart';

class AddFoodSheetState extends ConsumerState<AddFoodSheet> {
  final _search = TextEditingController();
  CatalogFood? _picked;
  var _scanning = false;
  var _estimating = false;
  var _myFoods = false;
  CustomFood? _pickedCustom;
  final _name = TextEditingController();
  final _kcal = TextEditingController();
  final _protein = TextEditingController();
  final _carbs = TextEditingController();
  final _fat = TextEditingController();
  late Meal _meal = widget.entry?.meal ?? widget.meal ?? _defaultMeal();
  late CalendarDate _day = widget.entry?.date ?? widget.day;
  final _quantity = TextEditingController(text: '1');
  var _source = QuantitySource.labelServing;
  PortionUnit? _unit = PortionUnit.serving;

  /// What the typed numbers are for. Only a label serving offers "one
  /// serving"; everything else is for everything eaten (MM-167).
  var _basis = NutritionBasis.enteredTotals;

  /// An entry logged before amounts were recorded: no amount is asked for it
  /// and none is invented.
  var _legacy = false;

  /// For an entry calculated from a food's reference nutrition: its amount can
  /// be changed and the totals follow; its totals are not typed.
  ReferenceNutrition? _calcRef;

  @override
  void initState() {
    super.initState();
    final entry = widget.entry;
    final query = widget.initialQuery;
    if (query != null) _search.text = query;
    if (widget.estimateSize != null) _estimating = true;
    if (entry == null) return;
    final portion = entry.portion;
    _name.text = entry.name;
    _source = entry.source;
    if (portion == null) {
      _fill(entry);
      _legacy = true;
      _unit = null;
      _quantity.clear();
    } else if (portion.basis == NutritionBasis.calculated &&
        portion.reference != null) {
      _calcRef = portion.reference;
      _unit = portion.unit;
      _quantity.text = quantityText(portion.quantity ?? 1);
    } else {
      _fill(entry);
    }
    _search.clear();
  }

  @override
  void dispose() {
    for (final c in [
      _search,
      _name,
      _kcal,
      _protein,
      _carbs,
      _fat,
      _quantity,
    ]) {
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

  double? get _amount => parseQuantity(_quantity.text);

  bool get _amountRequired =>
      _calcRef != null || (!_legacy && _source != QuantitySource.quickAdd);

  bool get _amountOk => !_amountRequired || _amount != null;

  /// The reference a per-serving entry is calculated from.
  ReferenceNutrition? get _perServingRef {
    final energy = _energy;
    if (_basis != NutritionBasis.calculated || energy == null) return null;
    return ReferenceNutrition(
      basis: ReferenceBasis.perServing,
      nutrition: NutritionTotals(
        kcal: energy,
        proteinG: _p,
        carbsG: _c,
        fatG: _f,
      ),
      servingUnit: PortionUnit.serving,
    );
  }

  /// The totals this entry will log, or null while they cannot be known.
  NutritionTotals? get _totals {
    final amount = _amount;
    final calc = _calcRef;
    if (calc != null) {
      return amount == null || _unit == null
          ? null
          : scaleNutrition(amount, _unit!, calc);
    }
    final energy = _energy;
    if (energy == null) return null;
    final typed = NutritionTotals(
      kcal: energy,
      proteinG: _p,
      carbsG: _c,
      fatG: _f,
    );
    final perServing = _perServingRef;
    if (perServing != null) {
      return amount == null
          ? null
          : scaleNutrition(amount, PortionUnit.serving, perServing);
    }
    return typed;
  }

  bool get _valid {
    final totals = _totals;
    return _name.text.trim().isNotEmpty &&
        _amountOk &&
        totals != null &&
        totals.kcal > 0 &&
        (_calcRef != null || (_p >= 0 && _c >= 0 && _f >= 0));
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
    _basis = NutritionBasis.enteredTotals;
    final portion = e.portion;
    _legacy = false;
    if (portion != null && portion.quantity != null && portion.unit != null) {
      _unit = portion.unit;
      _quantity.text = quantityText(portion.quantity!);
    } else {
      _unit = unitsOffered(e.source).firstOrNull;
      _quantity.clear();
    }
    _search.clear();
  });

  void _selectMethod(QuantitySource method) => setState(() {
    _source = method;
    _unit = unitsOffered(method).firstOrNull;
    _quantity.clear();
    _basis = NutritionBasis.enteredTotals;
    _legacy = false;
  });

  /// Stops calculating from the food and lets the totals be typed.
  void _enterTotalsMyself() => setState(() {
    final t = _totals;
    String n(double v) =>
        v == v.roundToDouble() ? v.round().toString() : v.toStringAsFixed(1);
    if (t != null) {
      _kcal.text = n(t.kcal);
      _protein.text = n(t.proteinG);
      _carbs.text = n(t.carbsG);
      _fat.text = n(t.fatG);
    }
    _calcRef = null;
    _basis = NutritionBasis.enteredTotals;
  });

  /// The method an edited calculated entry is now measured by.
  QuantitySource get _calcMethod {
    final unit = _unit!;
    if (unit.isWeight) return QuantitySource.weighed;
    if (unit == PortionUnit.serving) {
      return _source == QuantitySource.householdMeasure
          ? QuantitySource.householdMeasure
          : QuantitySource.labelServing;
    }
    return QuantitySource.householdMeasure;
  }

  Portion? get _portion {
    if (_legacy) return null;
    final calc = _calcRef;
    if (calc != null) {
      return Portion(
        method: _calcMethod,
        basis: NutritionBasis.calculated,
        quantity: _amount,
        unit: _unit,
        reference: calc,
      );
    }
    if (_source == QuantitySource.quickAdd) {
      return Portion(method: _source, basis: NutritionBasis.enteredTotals);
    }
    return Portion(
      method: _source,
      basis: _basis,
      quantity: _amount,
      unit: _basis == NutritionBasis.calculated ? PortionUnit.serving : _unit,
      reference: _perServingRef,
    );
  }

  Future<void> _save() async {
    final editing = widget.entry;
    final totals = _totals!;
    final portion = _portion;
    final entry = FoodEntry(
      id: editing?.id ?? 0,
      date: _day,
      meal: _meal,
      name: _name.text.trim(),
      kcal: totals.kcal,
      proteinG: totals.proteinG,
      carbsG: totals.carbsG,
      fatG: totals.fatG,
      source: portion?.method ?? _source,
      portion: portion,
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
          alternate: ref.watch(foodCatalogProvider).value?.pairOf(picked),
          servings:
              ref.watch(foodCatalogProvider).value?.servingsOf(picked) ??
              const [],
          day: widget.day,
          meal: _meal,
          onBack: () => setState(() => _picked = null),
        ),
      );
    }
    final pickedCustom = _pickedCustom;
    if (pickedCustom != null) {
      return _sheet(
        FoodAmountStep(
          food: customCatalogFood(pickedCustom),
          custom: pickedCustom,
          servings: const [],
          day: widget.day,
          meal: _meal,
          onBack: () => setState(() => _pickedCustom = null),
        ),
      );
    }
    if (_myFoods) {
      return _sheet(
        MyFoodsStep(onBack: () => setState(() => _myFoods = false)),
      );
    }
    if (_estimating) {
      return _sheet(
        EstimateMealStep(
          day: widget.day,
          meal: _meal,
          initialSize: widget.estimateSize ?? MealSize.regular,
          onBack: () => setState(() => _estimating = false),
        ),
      );
    }
    if (_scanning) {
      return _sheet(
        BarcodeScanStep(
          onFound: (food) => setState(() {
            _scanning = false;
            _picked = food;
          }),
          onFoundCustom: (food) => setState(() {
            _scanning = false;
            _pickedCustom = food;
          }),
          onManual: () => setState(() => _scanning = false),
          onBack: () => setState(() => _scanning = false),
        ),
      );
    }
    final matchingRecents = query.isEmpty
        ? const <FoodEntry>[]
        : recents
              .where((e) => e.name.toLowerCase().contains(query.toLowerCase()))
              .toList();

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
          if (!editing && query.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  Expanded(
                    child: MmButton(
                      key: const ValueKey('food-scan'),
                      label: 'Scan',
                      kind: MmButtonKind.secondary,
                      icon: Icons.qr_code_scanner,
                      onPressed: () => setState(() => _scanning = true),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: MmButton(
                      key: const ValueKey('food-my-foods'),
                      label: 'Saved',
                      kind: MmButtonKind.secondary,
                      icon: Icons.bookmark_border,
                      onPressed: () => setState(() => _myFoods = true),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: MmButton(
                      key: const ValueKey('food-estimate'),
                      label: 'Estimate',
                      kind: MmButtonKind.secondary,
                      icon: Icons.restaurant,
                      onPressed: () => setState(() => _estimating = true),
                    ),
                  ),
                ],
              ),
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
            for (final f
                in ref
                    .watch(customFoodsProvider)
                    .maybeWhen(
                      data: (all) => all
                          .where(
                            (f) => f.name.toLowerCase().contains(
                              query.toLowerCase(),
                            ),
                          )
                          .toList(),
                      orElse: () => const <CustomFood>[],
                    ))
              MmListRow(
                key: ValueKey('custom-hit-${f.id}'),
                title: f.name,
                subtitle:
                    '${f.kind == CustomFoodKind.recipe ? 'Your recipe' : 'Your food'} · '
                    '${f.servingDescription} · ${Fmt.kcal(f.perServing.kcal)}',
                onTap: () => setState(() => _pickedCustom = f),
              ),
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
            ..._form(),
          ],
        ],
      ),
    );
  }

  Widget _number(TextEditingController c, String label, String key) => Expanded(
    child: MmTextField(
      key: ValueKey('food-$key'),
      controller: c,
      label: label,
      kind: MmTextFieldKind.number,
      dense: true,
      onChanged: (_) => setState(() {}),
    ),
  );

  /// The name, the amount and the numbers: what the sheet collects once a
  /// food is being typed or edited rather than searched for.
  List<Widget> _form() {
    final text = Theme.of(context).textTheme;
    final editing = widget.entry != null;
    final calc = _calcRef;
    final totals = _totals;
    return [
      const SizedBox(height: 12),
      MmTextField(
        key: const ValueKey('food-name'),
        controller: _name,
        label: 'Food',
        onChanged: (_) => setState(() {}),
      ),
      if (calc != null)
        ..._calculatedFields(text, calc)
      else
        ..._typedFields(text),
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
      if (totals != null &&
          (_basis == NutritionBasis.calculated || calc != null)) ...[
        const SizedBox(height: 12),
        Text(
          'Logs ${totals.kcal.round()} kcal · ${totals.proteinG.round()} g '
          'protein · ${totals.carbsG.round()} g carbs · '
          '${totals.fatG.round()} g fat',
          key: const ValueKey('logged-totals'),
          style: text.titleMedium,
        ),
      ],
      const SizedBox(height: 16),
      MmButton(
        key: const ValueKey('food-save'),
        label: editing ? 'Save changes' : 'Log it',
        expand: true,
        onPressed: _valid ? _save : null,
      ),
    ];
  }

  /// The amount: units to choose, and a field that takes decimals and simple
  /// fractions. An Estimate has none; an old entry is not asked for one.
  List<Widget> _amountFields(TextTheme text) {
    if (_legacy) {
      return const [
        SizedBox(height: 12),
        Notice(
          text:
              'This entry was logged without an amount. Choose how it was '
              'measured to add one.',
        ),
      ];
    }
    if (_source == QuantitySource.quickAdd) {
      return [
        const SizedBox(height: 8),
        Text(
          'Enter calories and macros for everything you ate.',
          style: text.bodySmall,
        ),
      ];
    }
    final units = unitsOffered(_source);
    final unit = _unit;
    final amount = _amount;
    final empty = _quantity.text.trim().isEmpty;
    return [
      if (units.length > 1) ...[
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            for (final u in units)
              MmChoiceChip(
                label: u.chipLabel,
                selected: unit == u,
                onSelected: () => setState(() => _unit = u),
              ),
          ],
        ),
      ],
      const SizedBox(height: 12),
      MmTextField(
        key: const ValueKey('portion-quantity'),
        controller: _quantity,
        label: switch (_source) {
          QuantitySource.labelServing => 'Servings eaten',
          QuantitySource.palm ||
          QuantitySource.cuppedHand ||
          QuantitySource.thumb => 'How many ${unit?.of(2) ?? ''}',
          _ => 'Amount',
        },
        suffix: unit == null || units.length == 1 && unit == PortionUnit.serving
            ? null
            : unit.of(amount ?? 2),
        kind: MmTextFieldKind.quantity,
        helper: amount == null
            ? (empty
                  ? 'How much did you eat?'
                  : 'An amount above zero is needed.')
            : null,
        helperIsWarning: amount == null && !empty,
        onChanged: (_) => setState(() {}),
      ),
    ];
  }

  /// How it was measured, the amount, what the numbers are for, and the
  /// numbers themselves.
  List<Widget> _typedFields(TextTheme text) {
    final perServing = _basis == NutritionBasis.calculated;
    return [
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
              onSelected: () => _selectMethod(source),
            ),
        ],
      ),
      ..._amountFields(text),
      const SizedBox(height: 16),
      Text('The numbers below are for', style: text.labelLarge),
      const SizedBox(height: 4),
      if (_source == QuantitySource.labelServing && !_legacy)
        MmSegmented<NutritionBasis>(
          segments: const [
            MmSegment(NutritionBasis.enteredTotals, 'Everything I ate'),
            MmSegment(NutritionBasis.calculated, 'One serving'),
          ],
          selected: {_basis},
          onChanged: (s) => setState(() => _basis = s.first),
        )
      else
        Text('Everything you ate', style: text.bodyMedium),
      const SizedBox(height: 12),
      Row(
        children: [
          _number(_protein, 'Protein g', 'protein'),
          const SizedBox(width: 8),
          _number(_carbs, 'Carbs g', 'carbs'),
          const SizedBox(width: 8),
          _number(_fat, 'Fat g', 'fat'),
        ],
      ),
      const SizedBox(height: 12),
      MmTextField(
        key: const ValueKey('food-kcal'),
        controller: _kcal,
        label: perServing ? 'Calories per serving' : 'Calories',
        kind: MmTextFieldKind.number,
        hint: _fromMacros > 0 ? '${_fromMacros.round()} from macros' : null,
        helper: _mismatch
            ? 'Macros add up to ${_fromMacros.round()} kcal. '
                  'Double-check the label.'
            : 'Leave blank to calculate from macros.',
        helperIsWarning: _mismatch,
        onChanged: (_) => setState(() {}),
      ),
    ];
  }

  /// An entry calculated from a food's own numbers: change the amount and the
  /// totals follow, or type the totals yourself.
  List<Widget> _calculatedFields(TextTheme text, ReferenceNutrition calc) {
    final candidates = [
      PortionUnit.serving,
      PortionUnit.gram,
      PortionUnit.ounce,
      PortionUnit.cup,
      PortionUnit.tablespoon,
      PortionUnit.teaspoon,
      PortionUnit.milliliter,
    ].where((u) => scaleNutrition(1, u, calc) != null).toList();
    final unit = _unit;
    final amount = _amount;
    return [
      const SizedBox(height: 12),
      Wrap(
        spacing: 8,
        children: [
          for (final u in candidates)
            MmChoiceChip(
              label: u == PortionUnit.serving
                  ? (calc.servingDescription ?? 'Servings')
                  : u.chipLabel,
              selected: unit == u,
              onSelected: () => setState(() {
                _unit = u;
                _quantity.clear();
              }),
            ),
        ],
      ),
      const SizedBox(height: 12),
      MmTextField(
        key: const ValueKey('portion-quantity'),
        controller: _quantity,
        label: unit == PortionUnit.serving ? 'How many' : 'Amount',
        suffix: unit == null || unit == PortionUnit.serving
            ? null
            : unit.of(amount ?? 2),
        kind: MmTextFieldKind.quantity,
        helper: amount == null ? 'An amount above zero is needed.' : null,
        helperIsWarning: amount == null,
        onChanged: (_) => setState(() {}),
      ),
      MmButton(
        label: 'Enter the totals myself',
        kind: MmButtonKind.text,
        onPressed: _enterTotalsMyself,
      ),
    ];
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
