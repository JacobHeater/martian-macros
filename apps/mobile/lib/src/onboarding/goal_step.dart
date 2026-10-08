import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/goal_mode_label.dart';
import '../ui/choice_card.dart';
import '../ui/notice.dart';
import 'mode_reason_explanation.dart';

/// Step 5: the recommended plan and the allowed alternatives.
class GoalStep extends StatelessWidget {
  const GoalStep({
    required this.policy,
    required this.recommendation,
    required this.selected,
    required this.onMode,
    super.key,
  });

  final CoachingPolicy policy;
  final ModeRecommendation recommendation;
  final GoalMode selected;
  final ValueChanged<GoalMode> onMode;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Your plan', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 12),
        Notice(
          icon: Icons.lightbulb_outline,
          text:
              'We recommend ${recommendation.mode.label.toLowerCase()}. '
              '${recommendation.reason.explanation}',
        ),
        const SizedBox(height: 16),
        for (final mode in GoalMode.values)
          if (policy.allowedModes.contains(mode))
            ChoiceCard(
              label: mode.label,
              detail: mode.blurb,
              selected: selected == mode,
              badge: mode == recommendation.mode ? 'Recommended' : null,
              onTap: () => onMode(mode),
            ),
        const SizedBox(height: 16),
        const Notice(
          icon: Icons.calendar_month_outlined,
          text:
              'Your first two weeks are calibration: log your food and '
              'weigh in daily, and your targets hold steady. After that '
              'they adapt weekly to how your body actually responds.',
        ),
      ],
    );
  }
}
