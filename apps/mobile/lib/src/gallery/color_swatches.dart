import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';

/// Every color token with its name and value, on the surface it is used on.
class ColorSwatches extends StatelessWidget {
  const ColorSwatches({super.key});

  @override
  Widget build(BuildContext context) {
    final mm = context.mm;
    final tokens = <String, Color>{
      'canvas': mm.canvas,
      'surface': mm.surface,
      'raised': mm.raised,
      'overlay': mm.overlay,
      'sunken': mm.sunken,
      'track': mm.track,
      'selected': mm.selected,
      'outline': mm.outline,
      'outlineStrong': mm.outlineStrong,
      'text': mm.text,
      'text2': mm.text2,
      'text3': mm.text3,
      'ember': mm.ember,
      'ion': mm.ion,
      'energy': mm.energy,
      'protein': mm.protein,
      'carbs': mm.carbs,
      'fat': mm.fat,
      'positive': mm.positive,
      'caution': mm.caution,
      'info': mm.info,
      'danger': mm.danger,
    };
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final MapEntry(:key, :value) in tokens.entries)
          SizedBox(
            width: 104,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: value,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: mm.outline),
                  ),
                ),
                const SizedBox(height: 4),
                Text(key, style: Theme.of(context).textTheme.labelMedium),
                Text(
                  '#${(value.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0').toUpperCase()}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
      ],
    );
  }
}
