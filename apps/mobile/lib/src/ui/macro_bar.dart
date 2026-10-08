import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'macro_kind.dart';

/// One macro's progress: its name, grams against the target, and a bar in the
/// macro's color. The label is always shown, so color is never the only cue.
class MacroBar extends StatelessWidget {
  const MacroBar({
    required this.macro,
    required this.grams,
    this.target,
    super.key,
  });

  final MacroKind macro;
  final double grams;

  /// Null before targets exist; the bar is then empty.
  final double? target;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final mm = context.mm;
    final color = switch (macro) {
      MacroKind.protein => mm.protein,
      MacroKind.carbs => mm.carbs,
      MacroKind.fat => mm.fat,
    };
    final t = target;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(macro.label, style: text.labelMedium),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: t == null || t <= 0 ? 0 : (grams / t).clamp(0, 1),
          color: color,
          minHeight: 6,
          borderRadius: BorderRadius.circular(3),
        ),
        const SizedBox(height: 4),
        Text(
          t == null
              ? '${grams.round()} g'
              : '${grams.round()} / ${t.round()} g',
          style: text.bodySmall,
        ),
      ],
    );
  }
}
