import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../format/meal_label.dart';
import '../format/portion_unit_label.dart';
import '../format/quantity_text.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_choice_chip.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import '../format/rounded_to_zero_note.dart';
import 'amount_choice.dart';
import 'food_amount_step.dart';
import 'food_trust_mark.dart';

class FoodAmountStepState extends ConsumerState<FoodAmountStep> {
  final _quantity = TextEditingController();
  late final List<AmountChoice> _choices = _initialChoices();

  List<AmountChoice> _initialChoices() {
    final custom = widget.custom;
    if (custom == null) {
      return [
        for (final s in widget.servings) AmountChoice(PortionUnit.serving, s),
        const AmountChoice(PortionUnit.gram, null),
        const AmountChoice(PortionUnit.ounce, null),
        if (ref.read(handSizeProvider) != null) ...const [
          AmountChoice(PortionUnit.palm, null),
          AmountChoice(PortionUnit.cuppedHand, null),
          AmountChoice(PortionUnit.thumb, null),
        ],
      ];
    }
    final grams = custom.servingGrams;
    return [
      AmountChoice(
        PortionUnit.serving,
        CatalogServing(
          description: custom.servingDescription,
          grams: grams ?? 0,
        ),
      ),
      if (grams != null) ...const [
        AmountChoice(PortionUnit.gram, null),
        AmountChoice(PortionUnit.ounce, null),
      ],
    ];
  }

  late AmountChoice _choice = _choices.first;
  late Meal _meal = widget.meal;

  /// The food being logged: the one chosen, or its raw or cooked counterpart.
  late CatalogFood _food = widget.food;

  @override
  void initState() {
    super.initState();
    _quantity.text = _defaultQuantity(_choice);
  }

  @override
  void dispose() {
    _quantity.dispose();
    super.dispose();
  }

  static String _defaultQuantity(AmountChoice c) => switch (c.unit) {
    PortionUnit.gram => '100',
    PortionUnit.ounce => '4',
    _ => '1',
  };

  /// The food's nutrition for 100 g, with the chosen serving's details so the
  /// entry can say what it was scaled from.
  ReferenceNutrition get _reference {
    final custom = widget.custom;
    if (custom != null) {
      return ReferenceNutrition(
        basis: ReferenceBasis.perServing,
        nutrition: custom.perServing,
        servingDescription: custom.servingDescription,
        servingGrams: custom.servingGrams,
        servingUnit: PortionUnit.serving,
      );
    }
    final food = _food;
    final serving = _choice.serving;
    return ReferenceNutrition(
      basis: ReferenceBasis.per100g,
      nutrition: NutritionTotals(
        kcal: food.kcal,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
      ),
      servingDescription: serving?.description,
      servingGrams: serving?.grams,
      servingUnit: serving == null ? null : PortionUnit.serving,
      densityGPerMl: food.densityGPerMl,
    );
  }

  double? get _amount => parseQuantity(_quantity.text);

  NutritionTotals? get _totals {
    final q = _amount;
    return q == null
        ? null
        : scaleNutrition(
            q,
            _choice.unit,
            _reference,
            hand: ref.read(handSizeProvider),
          );
  }

  double? get _grams {
    final q = _amount;
    return q == null
        ? null
        : gramsFor(
            q,
            _choice.unit,
            _reference,
            hand: ref.read(handSizeProvider),
          );
  }

  /// A label serving from a packaged product is recorded as one; a serving of
  /// a generic food is a household measure; a weight is a weighing.
  QuantitySource get _method {
    if (_choice.unit.isWeight) return QuantitySource.weighed;
    final hand = _handMethod(_choice.unit);
    if (hand != null) return hand;
    final packaged =
        widget.custom != null ||
        _food.source == 'usda_branded' ||
        _food.source == 'off';
    return packaged
        ? QuantitySource.labelServing
        : QuantitySource.householdMeasure;
  }

  static QuantitySource? _handMethod(PortionUnit unit) => switch (unit) {
    PortionUnit.palm => QuantitySource.palm,
    PortionUnit.cuppedHand => QuantitySource.cuppedHand,
    PortionUnit.thumb => QuantitySource.thumb,
    _ => null,
  };

  String _n(double v) => v.round().toString();

  /// What the food is when it is weighed: cooked, dry or raw.
  static String _stateLabel(CatalogFood f) => switch (f.preparation) {
    PreparationState.cooked => 'Cooked',
    PreparationState.raw =>
      f.name.toLowerCase().contains(', dry') ? 'Dry' : 'Raw',
    _ => 'As listed',
  };

  /// The size of the difference, which is the education (MM-151).
  String _consequence(double grams) {
    String line(CatalogFood f) =>
        '${_n(grams)} g ${_stateLabel(f).toLowerCase()} is about '
        '${_n(f.kcal * grams / 100)} kcal';
    return '${line(widget.food)}. ${line(widget.alternate!)}.';
  }

  /// A per-100 g nutrient for the grams eaten, or null when not known.
  double? _extra(double? per100g) {
    final grams = _grams;
    return per100g == null || grams == null ? null : per100g * grams / 100;
  }

  Future<void> _log() async {
    final food = _food;
    final totals = _totals!;
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
            kcal: totals.kcal,
            proteinG: totals.proteinG,
            carbsG: totals.carbsG,
            fatG: totals.fatG,
            source: _method,
            fiberG: _extra(food.fiberG),
            sodiumMg: _extra(food.sodiumMg),
            alcoholG: _extra(food.alcoholG),
            portion: Portion(
              method: _method,
              basis: NutritionBasis.calculated,
              quantity: _amount,
              unit: _choice.unit,
              reference: _reference,
              impliedGrams: _choice.unit.isHand ? _grams : null,
              handModelVersion: _choice.unit.isHand ? HandModel.version : null,
              origin: FoodOrigin(
                packId: food.packId,
                foodId: food.id,
                source: food.source,
                sourceId: food.sourceId,
              ),
            ),
          ),
        );
    if (mounted) Navigator.of(context).pop();
  }

  void _pick(AmountChoice c) => setState(() {
    _choice = c;
    _quantity.text = _defaultQuantity(c);
  });

  String _label(AmountChoice c) => c.serving == null
      ? c.unit.chipLabel
      : c.serving!.grams > 0
      ? '${c.serving!.description} (${_n(c.serving!.grams)} g)'
      : c.serving!.description;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final food = _food;
    final totals = _totals;
    final grams = _grams;
    final note = grams == null || widget.custom != null
        ? null
        : roundedToZeroNote(
            food,
            CatalogServing(description: 'amount', grams: grams),
          );
    final invalid = _quantity.text.trim().isNotEmpty && _amount == null;
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
            for (final c in _choices)
              MmChoiceChip(
                label: _label(c),
                selected: identical(_choice, c),
                onSelected: () => _pick(c),
              ),
          ],
        ),
        if (widget.alternate != null && _choice.unit.isWeight) ...[
          const SizedBox(height: 12),
          Text('Weighed as', style: text.labelLarge),
          const SizedBox(height: 4),
          MmSegmented<bool>(
            segments: [
              MmSegment(false, _stateLabel(widget.food)),
              MmSegment(true, _stateLabel(widget.alternate!)),
            ],
            selected: {identical(_food, widget.alternate)},
            onChanged: (s) => setState(
              () => _food = s.first ? widget.alternate! : widget.food,
            ),
          ),
          if (_amount != null && _grams != null) ...[
            const SizedBox(height: 4),
            Text(_consequence(_grams!), style: text.bodySmall),
          ],
        ],
        const SizedBox(height: 12),
        MmTextField(
          key: const ValueKey('amount-quantity'),
          controller: _quantity,
          label: _choice.unit == PortionUnit.serving
              ? 'How many servings'
              : 'Amount (${_choice.unit.of(2)})',
          kind: MmTextFieldKind.quantity,
          helper: invalid || _amount == null
              ? 'An amount above zero is needed.'
              : _choice.unit == PortionUnit.serving && grams != null
              ? '${quantityText(double.parse(grams.toStringAsFixed(0)))} g'
              : null,
          helperIsWarning: invalid,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 12),
        Text(
          totals == null
              ? 'Enter an amount to see the totals.'
              : '${_n(totals.kcal)} kcal · ${_n(totals.proteinG)} g protein · '
                    '${_n(totals.carbsG)} g carbs · ${_n(totals.fatG)} g fat',
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
          onPressed: totals == null ? null : _log,
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
