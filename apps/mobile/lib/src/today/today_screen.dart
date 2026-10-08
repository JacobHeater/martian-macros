import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/day_stepper.dart';
import '../ui/info_card.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/notice.dart';
import 'day_summary_card.dart';
import 'meal_section.dart';
import 'selected_day_provider.dart';
import 'targets_on.dart';

import 'package:mm_engine/mm_engine.dart';

class TodayScreen extends ConsumerWidget {
  const TodayScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final today = ref.watch(todayProvider);
    final day = shownDay(ref);
    final setup = ref.watch(setupProvider).value;
    final entries = ref.watch(foodForDayProvider(day)).value ?? const [];
    final history = ref.watch(targetsHistoryProvider).value ?? const [];
    final targets = targetsOn(history, day);
    final completeness =
        ref.watch(completenessProvider(day)).value ?? DayCompleteness.unmarked;
    final intake = intakeDayFrom(day, entries);

    final calibrationDay = setup == null
        ? null
        : setup.onboardedOn.daysUntil(today) + 1;

    void go(CalendarDate target) => ref
        .read(selectedDayProvider.notifier)
        .set(target == today ? null : target);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        DayStepper(
          label: Fmt.day(day, today),
          onPrevious: () => go(day.addDays(-1)),
          onNext: day.isBefore(today) ? () => go(day.addDays(1)) : null,
          onLabelTap: day == today ? null : () => go(today),
        ),
        if (calibrationDay != null && calibrationDay <= calibrationDays)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Notice(
              icon: Icons.tune,
              text:
                  'Calibration, day $calibrationDay of $calibrationDays. '
                  'Log everything and weigh in each morning. Your targets '
                  'stay put while the app learns your metabolism.',
            ),
          ),
        DaySummaryCard(intake: intake, targets: targets?.targets),
        for (final meal in Meal.values)
          MealSection(
            meal: meal,
            entries: [
              for (final e in entries)
                if (e.meal == meal) e,
            ],
          ),
        if (entries.isNotEmpty)
          InfoCard(
            title: 'Is this day fully logged?',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
      ],
    );
  }
}
