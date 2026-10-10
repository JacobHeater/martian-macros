import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../format/stall_text.dart';
import '../providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/info_card.dart';
import '../ui/mm_disclosure.dart';
import '../ui/stat_row.dart';

/// Shown on the Coach screen while progress has stalled against the goal
/// (MM-140): which kind of stall it is, in the user's own numbers, with the
/// figures it rests on. Hidden when there is no stall or it is too early to
/// tell.
class StallCard extends ConsumerWidget {
  const StallCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stall = ref.watch(stallAssessmentProvider);
    final setup = ref.watch(setupProvider).value;
    if (stall == null || setup == null || stall.status != StallStatus.stalled) {
      return const SizedBox.shrink();
    }
    final fmt = Fmt(setup.unitSystem);
    final text = Theme.of(context).textTheme;
    final (body, options) = stallText(stall, fmt);
    final slope = stall.slopeKgPerWeek;
    final intended = stall.intendedKgPerWeek;
    return InfoCard(
      key: const ValueKey('stall-card'),
      title: 'Progress has slowed',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(body, style: text.bodyMedium),
          if (options.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'Options',
              style: text.labelLarge?.copyWith(color: context.mm.text2),
            ),
            for (final option in options)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text('· $option', style: text.bodyMedium),
              ),
          ],
          MmDisclosure(
            title: 'What this rests on',
            children: [
              StatRow('Period', 'Last ${stall.windowDays} days'),
              StatRow('Fully logged days', '${stall.usableFoodDays}'),
              StatRow('Weigh-ins', '${stall.weighIns}'),
              if (slope != null)
                StatRow('Trend', '${fmt.weightDelta(slope)} a week'),
              if (intended != null)
                StatRow('Intended', '${fmt.weightDelta(intended)} a week'),
            ],
          ),
        ],
      ),
    );
  }
}
