import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'mm_text_field_kind.dart';

/// The app's text input.
class MmTextField extends StatelessWidget {
  const MmTextField({
    required this.controller,
    this.label,
    this.hint,
    this.helper,
    this.helperIsWarning = false,
    this.suffix,
    this.kind = MmTextFieldKind.text,
    this.dense = false,
    this.onChanged,
    super.key,
  });

  final TextEditingController controller;
  final String? label;
  final String? hint;
  final String? helper;

  /// Styles the helper as a caution (for a value that looks wrong).
  final bool helperIsWarning;

  /// A unit shown after the value.
  final String? suffix;
  final MmTextFieldKind kind;
  final bool dense;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    keyboardType: switch (kind) {
      MmTextFieldKind.number => const TextInputType.numberWithOptions(
        decimal: true,
      ),
      MmTextFieldKind.quantity => TextInputType.text,
      MmTextFieldKind.text => null,
    },
    textCapitalization: kind == MmTextFieldKind.text
        ? TextCapitalization.sentences
        : TextCapitalization.none,
    decoration: InputDecoration(
      labelText: label,
      hintText: hint,
      helperText: helper,
      helperStyle: helperIsWarning
          ? TextStyle(color: context.mm.caution)
          : null,
      suffixText: suffix,
      isDense: dense,
    ),
    onChanged: onChanged,
  );
}
