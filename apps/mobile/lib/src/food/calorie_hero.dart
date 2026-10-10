import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/horizon_arc.dart';
import '../ui/macro_bar.dart';
import '../ui/macro_kind.dart';
import '../ui/mm_hero_surface.dart';
import '../ui/mm_status_chip.dart';
import '../ui/status_row.dart';

/// The hero of a day: calories as a horizon arc, what is left, the macros, and
/// optionally one status line. Used by the dashboard and the Food screen.
class CalorieHero extends ConsumerWidget {
  const CalorieHero({
    required this.intake,
    required this.targets,
    this.macros = MacroKind.values,
    this.paused = false,
    this.status,
    this.confidence,
    this.onStatusTap,
    this.onTap,
    super.key,
  });

  final IntakeDay intake;
  final DailyTargets? targets;

  /// During a pause [targets] are a guide (MM-148): the hero shows what was
  /// logged beside it and never calls a day over.
  final bool paused;

  /// Which macros to show; protein is always emphasized.
  final List<MacroKind> macros;

  /// One line about the coach (calibration, a recent change).
  final String? status;
  final String? confidence;
  final VoidCallback? onStatusTap;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = Theme.of(context).textTheme;
    // Simple detail shows calories and protein only (MM-49).
    final level = ref.watch(detailLevelProvider).value ?? DetailLevel.standard;
    final macros = level.showsCarbsAndFat
        ? this.macros
        : [
            for (final m in this.macros)
              if (m == MacroKind.protein) m,
          ];
    final t = targets;
    final left = t == null || paused ? null : t.kcal - intake.kcal;
    final over = left != null && left < 0;
    final figure = left == null
        ? Fmt.whole(intake.kcal)
        : Fmt.whole(over ? -left : left);
    final caption = paused && t != null
        ? 'kcal logged · paused, guide ${Fmt.whole(t.kcal)}'
        : left == null
        ? 'kcal logged'
        : over
        ? 'kcal over ${Fmt.whole(t!.kcal)}'
        : 'kcal left of ${Fmt.whole(t!.kcal)}';
    return MmHeroSurface(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          HorizonArc(
            progress: t == null || t.kcal <= 0
                ? 0
                : paused
                ? (intake.kcal / t.kcal).clamp(0.0, 1.0)
                : intake.kcal / t.kcal,
            semanticsLabel: '$figure $caption',
          ),
          Text(figure, style: text.displayLarge, textAlign: TextAlign.center),
          Text(
            caption,
            style: text.bodyMedium?.copyWith(color: context.mm.text2),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          for (final macro in macros) ...[
            MacroBar(
              macro: macro,
              grams: switch (macro) {
                MacroKind.protein => intake.proteinG,
                MacroKind.carbs => intake.carbsG,
                MacroKind.fat => intake.fatG,
              },
              target: switch (macro) {
                MacroKind.protein => t?.proteinG,
                MacroKind.carbs => t?.carbsG,
                MacroKind.fat => t?.fatG,
              },
              minimum: macro == MacroKind.protein ? t?.proteinMinimumG : null,
              emphasized: macro == MacroKind.protein,
            ),
            if (macro != macros.last) const SizedBox(height: 12),
          ],
          if (status != null) ...[
            const SizedBox(height: 12),
            Divider(color: context.mm.outline),
            StatusRow(text: status!, onTap: onStatusTap ?? () {}),
          ],
          if (confidence != null)
            Align(
              alignment: Alignment.centerLeft,
              child: Padding(
                padding: const EdgeInsets.only(top: 8),
                child: MmStatusChip(label: confidence!),
              ),
            ),
        ],
      ),
    );
  }
}
