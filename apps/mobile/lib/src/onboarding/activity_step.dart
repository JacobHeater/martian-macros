import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/daily_activity_label.dart';
import '../theme/mm_colors_context.dart';
import '../ui/choice_card.dart';

/// Step 3: how active the day is outside workouts. With training days, this
/// sets the starting calorie estimate until the app has measured the user's own.
class ActivityStep extends StatelessWidget {
  const ActivityStep({
    required this.activity,
    required this.onActivity,
    super.key,
  });

  final DailyActivity activity;
  final ValueChanged<DailyActivity> onActivity;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Your day', style: text.headlineSmall),
        const SizedBox(height: 8),
        Text(
          'Outside of workouts, how much are you on your feet? This sets your '
          'starting calorie estimate until the app has measured your own.',
          style: text.bodyMedium?.copyWith(color: context.mm.text2),
        ),
        const SizedBox(height: 16),
        for (final option in DailyActivity.values)
          ChoiceCard(
            label: option.label,
            detail: option.detail,
            selected: activity == option,
            onTap: () => onActivity(option),
          ),
      ],
    );
  }
}
