import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../providers.dart';
import '../repository_role_providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/mm_surface.dart';
import 'calorie_hero.dart';
import 'meal_section.dart';
import 'selected_day_provider.dart';
import 'targets_on.dart';

/// The day's hero and its meals. The day header lives in the app bar.
class FoodScreen extends ConsumerWidget {
  const FoodScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final day = shownDay(ref);
    final entries = ref.watch(foodForDayProvider(day)).value ?? const [];
    final history = ref.watch(targetsHistoryProvider).value ?? const [];
    final targets = targetsOn(history, day);
    final completeness =
        ref.watch(completenessProvider(day)).value ?? DayCompleteness.unmarked;
    final text = Theme.of(context).textTheme;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 112),
      children: [
        CalorieHero(
          intake: intakeDayFrom(day, entries),
          targets: targets?.targets,
        ),
        if (entries.isEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              'Nothing logged yet. Start with breakfast.',
              style: text.bodyMedium?.copyWith(color: context.mm.text2),
            ),
          ),
        MmSurface(
          padded: false,
          clip: true,
          child: Column(
            children: [
              for (final meal in Meal.values) ...[
                if (meal != Meal.values.first)
                  Divider(height: 1, color: context.mm.outline),
                MealSection(
                  meal: meal,
                  day: day,
                  entries: [
                    for (final e in entries)
                      if (e.meal == meal) e,
                  ],
                ),
              ],
            ],
          ),
        ),
        if (entries.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text('Is this day fully logged?', style: text.titleMedium),
          const SizedBox(height: 8),
          MmSegmented<DayCompleteness>(
            allowEmpty: true,
            segments: const [
              MmSegment(
                DayCompleteness.complete,
                'Complete',
                icon: Icons.check,
              ),
              MmSegment(DayCompleteness.partial, 'Partial'),
            ],
            selected: {
              if (completeness != DayCompleteness.unmarked) completeness,
            },
            onChanged: (s) => ref
                .read(dayMarkWriterProvider)
                .setCompleteness(
                  day,
                  s.isEmpty ? DayCompleteness.unmarked : s.first,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Partial days are left out of your metabolism estimate '
            'instead of being read as under-eating.',
            style: text.bodySmall,
          ),
        ],
      ],
    );
  }
}
