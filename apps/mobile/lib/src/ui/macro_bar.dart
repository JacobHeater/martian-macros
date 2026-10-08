import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'macro_kind.dart';
import 'mm_progress_bar.dart';

/// One macro's progress: its name, grams against the target, and a bar in the
/// macro's color. The label is always shown, so color is never the only cue.
/// An emphasized macro (protein) gets a thicker bar and a stronger value.
class MacroBar extends StatelessWidget {
  const MacroBar({
    required this.macro,
    required this.grams,
    this.target,
    this.emphasized = false,
    super.key,
  });

  final MacroKind macro;
  final double grams;

  /// Null before targets exist; the bar is then empty.
  final double? target;
  final bool emphasized;

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
        Row(
          children: [
            Text(macro.label, style: text.labelMedium),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                textAlign: TextAlign.end,
                t == null
                    ? '${grams.round()} g'
                    : '${grams.round()} / ${t.round()} g',
                style: text.bodyMedium?.copyWith(
                  color: emphasized ? mm.text : mm.text2,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        MmProgressBar(
          value: t == null || t <= 0 ? 0 : (grams / t).clamp(0, 1),
          color: color,
          height: emphasized ? 8 : 6,
        ),
      ],
    );
  }
}
