import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../ui/macro_bar.dart';
import '../ui/macro_kind.dart';
import '../ui/mm_progress_bar.dart';
import '../ui/mm_surface.dart';

/// Today's calories against the target, and protein. Opens the Food screen.
class IntakeCard extends StatelessWidget {
  const IntakeCard({
    required this.intake,
    required this.targets,
    required this.onTap,
    super.key,
  });

  final IntakeDay intake;
  final DailyTargets? targets;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final t = targets;
    final remaining = t == null ? null : t.kcal - intake.kcal;
    return MmSurface(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(Fmt.whole(intake.kcal), style: text.displaySmall),
              const SizedBox(width: 8),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(
                    t == null ? 'kcal' : 'of ${Fmt.kcal(t.kcal)}',
                    style: text.bodyLarge,
                  ),
                ),
              ),
            ],
          ),
          if (t != null) ...[
            const SizedBox(height: 8),
            MmProgressBar(value: (intake.kcal / t.kcal).clamp(0, 1)),
            const SizedBox(height: 6),
            Text(
              remaining! >= 0
                  ? '${Fmt.whole(remaining)} kcal remaining'
                  : '${Fmt.whole(-remaining)} kcal over',
              style: text.bodyMedium,
            ),
          ],
          const SizedBox(height: 16),
          MacroBar(
            macro: MacroKind.protein,
            grams: intake.proteinG,
            target: t?.proteinG,
          ),
        ],
      ),
    );
  }
}
