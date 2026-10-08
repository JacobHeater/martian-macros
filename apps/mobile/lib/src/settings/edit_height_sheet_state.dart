import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/parse_number.dart';
import '../ui/mm_button.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import 'edit_height_sheet.dart';

class EditHeightSheetState extends State<EditHeightSheet> {
  final _feet = TextEditingController();
  final _inches = TextEditingController();
  final _cm = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.imperial) {
      final totalInches = Units.cmToInches(widget.initialCm).round();
      _feet.text = '${totalInches ~/ 12}';
      _inches.text = '${totalInches % 12}';
    } else {
      _cm.text = '${widget.initialCm.round()}';
    }
  }

  @override
  void dispose() {
    for (final c in [_feet, _inches, _cm]) {
      c.dispose();
    }
    super.dispose();
  }

  /// The entered height in centimetres, or null if it is not plausible.
  double? get _heightCm {
    final double? cm;
    if (widget.imperial) {
      final feet = parseNumber(_feet.text);
      final inches = parseNumber(_inches.text) ?? 0;
      cm = feet == null ? null : Units.inchesToCm(feet * 12 + inches);
    } else {
      cm = parseNumber(_cm.text);
    }
    return cm != null && cm >= 100 && cm <= 250 ? cm : null;
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      16,
      16,
      16,
      16 + MediaQuery.viewInsetsOf(context).bottom,
    ),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Height', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        if (widget.imperial)
          Row(
            children: [
              Expanded(
                child: MmTextField(
                  key: const ValueKey('height-feet'),
                  controller: _feet,
                  label: 'Feet',
                  kind: MmTextFieldKind.number,
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: MmTextField(
                  key: const ValueKey('height-inches'),
                  controller: _inches,
                  label: 'Inches',
                  kind: MmTextFieldKind.number,
                  onChanged: (_) => setState(() {}),
                ),
              ),
            ],
          )
        else
          MmTextField(
            key: const ValueKey('height-cm'),
            controller: _cm,
            label: 'Centimetres',
            kind: MmTextFieldKind.number,
            onChanged: (_) => setState(() {}),
          ),
        const SizedBox(height: 16),
        MmButton(
          key: const ValueKey('height-save'),
          label: 'Save',
          onPressed: _heightCm == null
              ? null
              : () {
                  widget.onSave(_heightCm!);
                  Navigator.of(context).pop();
                },
        ),
      ],
    ),
  );
}
