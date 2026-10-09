import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/mm_action_chip.dart';
import 'easy_to_miss_line.dart';
import 'show_add_food_sheet.dart';

class EasyToMissLineState extends ConsumerState<EasyToMissLine> {
  bool _recorded = false;

  /// Whether the line shows today, and records that it did.
  bool _visible() {
    final setup = ref.watch(setupProvider).value;
    final preference = ref.watch(easyToMissProvider).value;
    final today = ref.watch(todayProvider);
    if (setup == null || preference == null) return false;
    final visible = easyToMissVisible(
      today: today,
      onboardedOn: setup.onboardedOn,
      preference: preference,
      suppressed: setup.screening.eatingDisorderHistory,
    );
    if (visible && !_recorded && preference.lastShown != today) {
      _recorded = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ref.read(easyToMissWriterProvider).markEasyToMissShown(today);
        }
      });
    }
    return visible;
  }

  @override
  Widget build(BuildContext context) {
    if (!_visible()) return const SizedBox.shrink();
    final text = Theme.of(context).textTheme;
    Widget item(String label, VoidCallback onTap) => MmActionChip(
      key: ValueKey('easy-to-miss-$label'),
      label: label,
      onPressed: onTap,
    );
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Easy to miss', style: text.labelLarge),
          const SizedBox(height: 4),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [
              item(
                'cooking oil',
                () =>
                    showAddFoodSheet(context, widget.day, initialQuery: 'oil'),
              ),
              item(
                'drinks',
                () => showAddFoodSheet(
                  context,
                  widget.day,
                  initialQuery: 'drink',
                ),
              ),
              item(
                'sauces',
                () => showAddFoodSheet(
                  context,
                  widget.day,
                  initialQuery: 'sauce',
                ),
              ),
              item(
                'bites and tastes',
                () => showAddFoodSheet(
                  context,
                  widget.day,
                  estimateSize: MealSize.light,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
