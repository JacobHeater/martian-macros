import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../ui/day_stepper.dart';
import 'selected_day_provider.dart';

/// The Food screen's header: the shown day, with steps to the days either side.
class FoodDayHeader extends ConsumerWidget {
  const FoodDayHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final today = ref.watch(todayProvider);
    final day = shownDay(ref);
    void go(CalendarDate target) => ref
        .read(selectedDayProvider.notifier)
        .set(target == today ? null : target);
    return DayStepper(
      label: Fmt.day(day, today),
      onPrevious: () => go(day.addDays(-1)),
      onNext: day.isBefore(today) ? () => go(day.addDays(1)) : null,
      onLabelTap: day == today ? null : () => go(today),
    );
  }
}
