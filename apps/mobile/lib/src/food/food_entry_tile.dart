import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../format/quantity_source_label.dart';
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
                    'F ${entry.fatG.round()} · ${entry.source.label}',
                    style: text.bodySmall,
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
