import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../providers.dart';
import 'selected_day.dart';

final selectedDayProvider = NotifierProvider<SelectedDay, CalendarDate?>(
  SelectedDay.new,
);

/// The day the Today tab is showing.
CalendarDate shownDay(WidgetRef ref) =>
    ref.watch(selectedDayProvider) ?? ref.watch(todayProvider);
