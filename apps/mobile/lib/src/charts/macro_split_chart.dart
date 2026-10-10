import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../theme/mm_colors_context.dart';
import '../ui/macro_kind.dart';

/// The 4/4/9 energy split of logged macros, not percentages of target grams.
class MacroSplitChart extends StatelessWidget {
  const MacroSplitChart({super.key, required this.intake});

  final IntakeDay intake;

  @override
  Widget build(BuildContext context) {
    final grams = {
      MacroKind.protein: intake.proteinG,
      MacroKind.carbs: intake.carbsG,
      MacroKind.fat: intake.fatG,
    };
    final energy = {
      for (final entry in grams.entries)
        entry.key: entry.value * (entry.key == MacroKind.fat ? 9 : 4),
    };
    final total = energy.values.reduce((a, b) => a + b);
    if (total == 0) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Text('Log macro amounts to see your protein, carbs and fat split.'),
      );
    }
    Color color(MacroKind kind) => switch (kind) {
      MacroKind.protein => context.mm.protein,
      MacroKind.carbs => context.mm.carbs,
      MacroKind.fat => context.mm.fat,
    };
    String share(MacroKind kind) =>
        '${(100 * energy[kind]! / total).toStringAsFixed(1)}%';
    final labels = [
      for (final macro in MacroKind.values)
        '${macro.label}: ${Fmt.grams(grams[macro]!)} · ${share(macro)}',
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Semantics(
              image: true,
              label: 'Logged macronutrient energy split. ${labels.join('. ')}.',
              child: ExcludeSemantics(
                child: SizedBox(
                  width: 112,
                  height: 112,
                  child: PieChart(
                    PieChartData(
                      centerSpaceRadius: 24,
                      sectionsSpace: 3,
                      pieTouchData: PieTouchData(enabled: false),
                      sections: [
                        for (final macro in MacroKind.values)
                          if (energy[macro]! > 0)
                            PieChartSectionData(
                              value: energy[macro]!,
                              color: color(macro),
                              radius: 29,
                              showTitle: false,
                            ),
                      ],
                    ),
                    duration: Duration.zero,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final macro in MacroKind.values)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Text(
                        '${macro.label}\n'
                        '${Fmt.grams(grams[macro]!)} · ${share(macro)}',
                        style: Theme.of(context).textTheme.labelMedium
                            ?.copyWith(color: color(macro)),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          '${Fmt.kcal(total)} from recorded macros · '
          'protein/carbs 4 kcal/g, fat 9 kcal/g. '
          'Alcohol and other calorie differences are not part of this split.',
          style: Theme.of(context).textTheme.bodySmall
              ?.copyWith(color: context.mm.text2),
        ),
      ],
    );
  }
}
