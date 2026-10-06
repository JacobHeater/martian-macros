import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format.dart';
import '../providers.dart';
import '../widgets.dart';
import 'add_food_sheet.dart';

/// The day shown on the Today tab; null follows the real current day.
final selectedDayProvider = NotifierProvider<SelectedDay, CalendarDate?>(
  SelectedDay.new,
);

class SelectedDay extends Notifier<CalendarDate?> {
  @override
  CalendarDate? build() => null;

  void set(CalendarDate? day) => state = day;
}

CalendarDate _shownDay(WidgetRef ref) =>
    ref.watch(selectedDayProvider) ?? ref.watch(todayProvider);

class TodayScreen extends ConsumerWidget {
  const TodayScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final today = ref.watch(todayProvider);
    final day = _shownDay(ref);
    final setup = ref.watch(setupProvider).value;
    final entries = ref.watch(foodForDayProvider(day)).value ?? const [];
    final history = ref.watch(targetsHistoryProvider).value ?? const [];
    final targets = _targetsOn(history, day);
    final completeness =
        ref.watch(completenessProvider(day)).value ?? DayCompleteness.unmarked;
    final intake = intakeDayFrom(day, entries);

    final calibrationDay = setup == null
        ? null
        : setup.onboardedOn.daysUntil(today) + 1;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        _DayPicker(day: day, today: today),
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
        _SummaryCard(intake: intake, targets: targets?.targets),
        for (final meal in Meal.values)
          _MealSection(
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
                SegmentedButton<DayCompleteness>(
                  segments: const [
                    ButtonSegment(
                      value: DayCompleteness.complete,
                      label: Text('Complete'),
                      icon: Icon(Icons.check),
                    ),
                    ButtonSegment(
                      value: DayCompleteness.partial,
                      label: Text('Partial'),
                    ),
                  ],
                  emptySelectionAllowed: true,
                  selected: {
                    if (completeness != DayCompleteness.unmarked) completeness,
                  },
                  onSelectionChanged: (s) => ref
                      .read(storeProvider)
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

/// The targets that were in force on [day].
TargetsRecord? _targetsOn(List<TargetsRecord> history, CalendarDate day) {
  TargetsRecord? found;
  for (final record in history) {
    if (record.effectiveFrom.isAfter(day)) break;
    found = record;
  }
  return found ?? (history.isEmpty ? null : history.first);
}

class _DayPicker extends ConsumerWidget {
  const _DayPicker({required this.day, required this.today});

  final CalendarDate day;
  final CalendarDate today;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    void go(CalendarDate target) => ref
        .read(selectedDayProvider.notifier)
        .set(target == today ? null : target);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          tooltip: 'Previous day',
          icon: const Icon(Icons.chevron_left),
          onPressed: () => go(day.addDays(-1)),
        ),
        TextButton(
          onPressed: day == today ? null : () => go(today),
          child: Text(
            Fmt.day(day, today),
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
        IconButton(
          tooltip: 'Next day',
          icon: const Icon(Icons.chevron_right),
          onPressed: day.isBefore(today) ? () => go(day.addDays(1)) : null,
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.intake, required this.targets});

  final IntakeDay intake;
  final DailyTargets? targets;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;
    final t = targets;
    final remaining = t == null ? null : t.kcal - intake.kcal;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(Fmt.whole(intake.kcal), style: text.displaySmall),
                const SizedBox(width: 8),
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(
                    t == null ? 'kcal' : 'of ${Fmt.kcal(t.kcal)}',
                    style: text.bodyLarge,
                  ),
                ),
              ],
            ),
            if (t != null) ...[
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: (intake.kcal / t.kcal).clamp(0, 1),
                minHeight: 8,
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: 6),
              Text(
                remaining! >= 0
                    ? '${Fmt.whole(remaining)} kcal remaining'
                    : '${Fmt.whole(-remaining)} kcal over',
                style: text.bodyMedium?.copyWith(
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                _Macro('Protein', intake.proteinG, t?.proteinG, scheme.primary),
                const SizedBox(width: 12),
                _Macro('Carbs', intake.carbsG, t?.carbsG, scheme.tertiary),
                const SizedBox(width: 12),
                _Macro('Fat', intake.fatG, t?.fatG, scheme.secondary),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Macro extends StatelessWidget {
  const _Macro(this.label, this.grams, this.target, this.color);

  final String label;
  final double grams;
  final double? target;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final t = target;
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: text.labelMedium),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: t == null || t <= 0 ? 0 : (grams / t).clamp(0, 1),
            color: color,
            minHeight: 6,
            borderRadius: BorderRadius.circular(3),
          ),
          const SizedBox(height: 4),
          Text(
            t == null ? Fmt.grams(grams) : '${grams.round()} / ${t.round()} g',
            style: text.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _MealSection extends ConsumerWidget {
  const _MealSection({required this.meal, required this.entries});

  final Meal meal;
  final List<FoodEntry> entries;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (entries.isEmpty) return const SizedBox.shrink();
    final text = Theme.of(context).textTheme;
    final total = entries.fold(0.0, (sum, e) => sum + e.kcal);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
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
                color: Theme.of(context).colorScheme.errorContainer,
                alignment: Alignment.centerRight,
                padding: const EdgeInsets.only(right: 16),
                child: const Icon(Icons.delete_outline),
              ),
              onDismissed: (_) => ref.read(storeProvider).deleteFood(e.id),
              child: ListTile(
                dense: true,
                title: Text(e.name),
                subtitle: Text(
                  'P ${e.proteinG.round()}  C ${e.carbsG.round()}  '
                  'F ${e.fatG.round()}  ·  ${e.source.label}',
                ),
                trailing: Text(Fmt.whole(e.kcal), style: text.titleSmall),
              ),
            ),
        ],
      ),
    );
  }
}

class AddFoodButton extends ConsumerWidget {
  const AddFoodButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final day = _shownDay(ref);
    return FloatingActionButton.extended(
      onPressed: () => showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (_) => AddFoodSheet(day: day),
      ),
      icon: const Icon(Icons.add),
      label: const Text('Add food'),
    );
  }
}
