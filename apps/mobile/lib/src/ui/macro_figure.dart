import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'macro_kind.dart';

/// A macro's name and amount, with a short bar in the macro's color above it.
/// The name is always shown, so color is never the only cue.
class MacroFigure extends StatelessWidget {
  const MacroFigure({required this.macro, required this.value, super.key});

  final MacroKind macro;

  /// The amount, already formatted ("177 g").
  final String value;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final mm = context.mm;
    final color = switch (macro) {
      MacroKind.protein => mm.protein,
      MacroKind.carbs => mm.carbs,
      MacroKind.fat => mm.fat,
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 4,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 8),
        Text(macro.label, style: text.labelMedium?.copyWith(color: mm.text2)),
        Text(value, style: text.titleMedium),
      ],
    );
  }
}
