import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../../format/parse_number.dart';
import '../../format/quantity_text.dart';
import '../../repository_role_providers.dart';
import '../../ui/mm_button.dart';
import '../../ui/mm_button_kind.dart';
import '../../ui/mm_text_field.dart';
import '../../ui/mm_text_field_kind.dart';
import 'custom_food_form.dart';

class CustomFoodFormState extends ConsumerState<CustomFoodForm> {
  final _name = TextEditingController();
  final _serving = TextEditingController(text: '1 serving');
  final _grams = TextEditingController();
  final _kcal = TextEditingController();
  final _protein = TextEditingController();
  final _carbs = TextEditingController();
  final _fat = TextEditingController();
  final _barcode = TextEditingController();

  @override
  void initState() {
    super.initState();
    final f = widget.food;
    if (f == null) return;
    _name.text = f.name;
    _serving.text = f.servingDescription;
    _grams.text = f.servingGrams == null ? '' : quantityText(f.servingGrams!);
    _kcal.text = quantityText(
      double.parse(f.perServing.kcal.toStringAsFixed(1)),
    );
    _protein.text = quantityText(
      double.parse(f.perServing.proteinG.toStringAsFixed(1)),
    );
    _carbs.text = quantityText(
      double.parse(f.perServing.carbsG.toStringAsFixed(1)),
    );
    _fat.text = quantityText(
      double.parse(f.perServing.fatG.toStringAsFixed(1)),
    );
    _barcode.text = f.barcode ?? '';
  }

  @override
  void dispose() {
    for (final c in [
      _name,
      _serving,
      _grams,
      _kcal,
      _protein,
      _carbs,
      _fat,
      _barcode,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  double get _p => parseNumber(_protein.text) ?? 0;
  double get _c => parseNumber(_carbs.text) ?? 0;
  double get _f => parseNumber(_fat.text) ?? 0;
  double get _fromMacros => atwaterKcal(proteinG: _p, carbsG: _c, fatG: _f);

  double? get _energy {
    final typed = parseNumber(_kcal.text);
    if (typed != null) return typed;
    return _fromMacros > 0 ? _fromMacros : null;
  }

  bool get _mismatch {
    final typed = parseNumber(_kcal.text);
    if (typed == null || _fromMacros == 0) return false;
    return !macrosMatchEnergy(kcal: typed, proteinG: _p, carbsG: _c, fatG: _f);
  }

  double? get _servingGrams {
    final g = parseNumber(_grams.text);
    return g != null && g > 0 ? g : null;
  }

  /// The barcode as a GTIN-14, null when none was typed, or the problem.
  (String?, bool) get _gtin {
    final raw = _barcode.text.trim();
    if (raw.isEmpty) return (null, true);
    final gtin = normalizeBarcode(raw);
    return (gtin, gtin != null);
  }

  bool get _valid {
    final energy = _energy;
    return _name.text.trim().isNotEmpty &&
        _serving.text.trim().isNotEmpty &&
        _servingGrams != null &&
        energy != null &&
        energy > 0 &&
        _gtin.$2;
  }

  Future<void> _save() async {
    await ref
        .read(customFoodWriterProvider)
        .saveCustomFood(
          CustomFood(
            id: widget.food?.id ?? 0,
            name: _name.text.trim(),
            kind: CustomFoodKind.food,
            servingDescription: _serving.text.trim(),
            servingGrams: _servingGrams,
            perServing: NutritionTotals(
              kcal: _energy!,
              proteinG: _p,
              carbsG: _c,
              fatG: _f,
            ),
            barcode: _gtin.$1,
          ),
        );
    if (mounted) widget.onDone();
  }

  Widget _number(TextEditingController c, String label, String key) => Expanded(
    child: MmTextField(
      key: ValueKey('custom-$key'),
      controller: c,
      label: label,
      kind: MmTextFieldKind.number,
      dense: true,
      onChanged: (_) => setState(() {}),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final badBarcode = !_gtin.$2;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.food == null ? 'Save your own food' : 'Edit your food',
          style: text.titleLarge,
        ),
        const SizedBox(height: 12),
        MmTextField(
          key: const ValueKey('custom-name'),
          controller: _name,
          label: 'Name',
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              flex: 3,
              child: MmTextField(
                key: const ValueKey('custom-serving'),
                controller: _serving,
                label: 'One serving is',
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: MmTextField(
                key: const ValueKey('custom-grams'),
                controller: _grams,
                label: 'Weighs g',
                kind: MmTextFieldKind.number,
                onChanged: (_) => setState(() {}),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text('Numbers for one serving', style: text.labelLarge),
        const SizedBox(height: 4),
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
          key: const ValueKey('custom-kcal'),
          controller: _kcal,
          label: 'Calories',
          kind: MmTextFieldKind.number,
          hint: _fromMacros > 0 ? '${_fromMacros.round()} from macros' : null,
          helper: _mismatch
              ? 'Macros add up to ${_fromMacros.round()} kcal. '
                    'Double-check the label.'
              : 'Leave blank to calculate from macros.',
          helperIsWarning: _mismatch,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 12),
        MmTextField(
          key: const ValueKey('custom-barcode'),
          controller: _barcode,
          label: 'Barcode (optional)',
          kind: MmTextFieldKind.number,
          helper: badBarcode ? 'Those digits are not a valid barcode.' : null,
          helperIsWarning: badBarcode,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 16),
        MmButton(
          key: const ValueKey('custom-save'),
          label: 'Save food',
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
