import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/adherence_lines.dart';
import '../providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/info_card.dart';
import '../ui/stat_row.dart';

/// What the user did over the last seven days, described and not scored
/// (MM-149). Nothing here is a grade, and nothing praises eating under target.
class AdherenceCard extends ConsumerWidget {
  const AdherenceCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(adherenceSummaryProvider);
    final floor = ref.watch(coachProvider)?.calorieFloorKcal;
    if (summary == null || floor == null) return const SizedBox.shrink();
    return InfoCard(
      key: const ValueKey('adherence-card'),
      title: 'Your last 7 days',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final (label, value) in adherenceLines(
            summary,
            floorKcal: floor,
          ))
            StatRow(label, value),
          const SizedBox(height: 4),
          Text(
            'The seven days to yesterday. Days you did not log are not '
            'counted against anything.',
            style: Theme.of(context).textTheme.bodySmall
                ?.copyWith(color: context.mm.text2),
          ),
        ],
      ),
    );
  }
}
