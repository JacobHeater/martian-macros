import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../format/portion_summary.dart';
import '../theme/mm_colors_context.dart';

/// One logged food: name, macros and where the quantity came from, with its
/// energy on the right. The letters carry the meaning, not a color.
class FoodEntryTile extends StatelessWidget {
  const FoodEntryTile({required this.entry, super.key});

  final FoodEntry entry;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 56),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(entry.name, style: text.bodyLarge),
                  Text(
                    'P ${entry.proteinG.round()} · C ${entry.carbsG.round()} · '
                    'F ${entry.fatG.round()}',
                    style: text.bodySmall,
                  ),
                  Text(
                    portionSummary(entry),
                    key: const ValueKey('entry-portion'),
                    style: text.bodySmall?.copyWith(color: context.mm.text3),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              Fmt.whole(entry.kcal),
              style: text.titleMedium?.copyWith(color: context.mm.text),
            ),
          ],
        ),
      ),
    );
  }
}
