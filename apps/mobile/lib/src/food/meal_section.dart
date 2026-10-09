import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../format/meal_label.dart';
import '../repository_role_providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_icon_button.dart';
import '../ui/show_mm_snack_bar.dart';
import '../providers.dart';
import 'copy_entries.dart';
import 'entries_copied_to.dart';
import 'food_entry_tile.dart';
import 'show_add_food_sheet.dart';

/// One meal: its header with subtotal and an add button, then its entries.
/// A meal with no entries still shows its header, so every meal is an add
/// target and the list never jumps. Swipe an entry to delete it.
class MealSection extends ConsumerWidget {
  const MealSection({
    required this.meal,
    required this.day,
    required this.entries,
    super.key,
  });

  final Meal meal;
  final CalendarDate day;
  final List<FoodEntry> entries;

  /// Deletes [entry] and offers to put it back for a few seconds (MM-48).
  void _remove(BuildContext context, WidgetRef ref, FoodEntry entry) {
    final writer = ref.read(foodEntryWriterProvider);
    unawaited(writer.deleteFood(entry.id));
    showMmSnackBar(
      ScaffoldMessenger.of(context),
      'Removed ${entry.name}',
      actionLabel: 'Undo',
      onAction: () => unawaited(writer.addFood(entry)),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = Theme.of(context).textTheme;
    final total = entries.fold(0.0, (sum, e) => sum + e.kcal);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16),
          child: SizedBox(
            height: 48,
            child: Row(
              children: [
                Text(meal.label, style: text.labelLarge),
                const SizedBox(width: 8),
                if (entries.isNotEmpty)
                  Text(Fmt.kcal(total), style: text.bodySmall),
                const Spacer(),
                if (entries.isNotEmpty && day != ref.watch(todayProvider))
                  MmIconButton(
                    tooltip: 'Copy ${meal.label.toLowerCase()} to today',
                    icon: Icons.content_copy,
                    onPressed: () => copyEntries(
                      ref,
                      entriesCopiedTo(ref.read(todayProvider), entries),
                    ),
                  ),
                MmIconButton(
                  tooltip: 'Add ${meal.label.toLowerCase()}',
                  icon: Icons.add,
                  onPressed: () => showAddFoodSheet(context, day, meal: meal),
                ),
              ],
            ),
          ),
        ),
        for (final e in entries) ...[
          Divider(
            height: 1,
            indent: 16,
            endIndent: 16,
            color: context.mm.outline,
          ),
          Dismissible(
            key: ValueKey(e.id),
            direction: DismissDirection.endToStart,
            background: Container(
              color: context.mm.sunken,
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 16),
              child: Icon(Icons.delete_outline, color: context.mm.danger),
            ),
            onDismissed: (_) => _remove(context, ref, e),
            child: InkWell(
              onTap: () => showAddFoodSheet(context, day, entry: e),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: FoodEntryTile(entry: e),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
