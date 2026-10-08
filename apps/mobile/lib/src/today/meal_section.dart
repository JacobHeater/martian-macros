import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../format/meal_label.dart';
import '../repository_role_providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_surface.dart';
import 'food_entry_tile.dart';

/// One meal's entries with their subtotal; swipe an entry to delete it.
class MealSection extends ConsumerWidget {
  const MealSection({required this.meal, required this.entries, super.key});

  final Meal meal;
  final List<FoodEntry> entries;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (entries.isEmpty) return const SizedBox.shrink();
    final text = Theme.of(context).textTheme;
    final total = entries.fold(0.0, (sum, e) => sum + e.kcal);
    return MmSurface(
      padded: false,
      clip: true,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(
              children: [
                Expanded(child: Text(meal.label, style: text.titleSmall)),
                Text(Fmt.kcal(total), style: text.bodySmall),
              ],
            ),
          ),
          for (final e in entries)
            Dismissible(
              key: ValueKey(e.id),
              direction: DismissDirection.endToStart,
              background: Container(
                color: context.mm.sunken,
                alignment: Alignment.centerRight,
                padding: const EdgeInsets.only(right: 16),
                child: Icon(Icons.delete_outline, color: context.mm.danger),
              ),
              onDismissed: (_) =>
                  ref.read(foodEntryWriterProvider).deleteFood(e.id),
              child: FoodEntryTile(entry: e),
            ),
        ],
      ),
    );
  }
}
