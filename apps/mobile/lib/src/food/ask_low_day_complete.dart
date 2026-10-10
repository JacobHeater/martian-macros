import 'package:flutter/widgets.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../ui/show_mm_choice.dart';

/// Asked when a day far below the calorie floor is marked complete (MM-114).
/// A deliberate fast is a legitimate Yes. Returns the mark to store, or null
/// if the question was closed without an answer.
Future<DayCompleteness?> askLowDayComplete(
  BuildContext context, {
  required double loggedKcal,
}) => showMmChoice<DayCompleteness>(
  context,
  title: 'Is this everything you ate today?',
  message:
      '${Fmt.whole(loggedKcal)} kcal is logged. If food is missing, mark the '
      'day partial so the coach does not read it as a full day.',
  primaryLabel: 'Yes',
  primary: DayCompleteness.complete,
  secondaryLabel: 'Mark partial',
  secondary: DayCompleteness.partial,
);
