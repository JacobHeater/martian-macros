import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../ui/info_card.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_list_row.dart';
import '../ui/strength_trend_card.dart';
import 'strength_section.dart';
import 'strength_trends_provider.dart';

class StrengthHistoryScreen extends ConsumerWidget {
  const StrengthHistoryScreen({required this.exerciseId, super.key});

  final String exerciseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(strengthTrendsProvider);
    final trend = state.value
        ?.where((t) => t.exercise.id == exerciseId)
        .firstOrNull;
    final fmt = Fmt(ref.watch(setupProvider).requireValue!.unitSystem);
    return Scaffold(
      appBar: MmAppBar(title: trend?.exercise.name ?? 'Lift history'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (!state.hasValue || state.hasError)
            const StrengthSection()
          else if (trend == null)
            const InfoCard(
              title: 'No sessions',
              child: Text('This lift no longer has logged sessions.'),
            )
          else ...[
            StrengthTrendCard(
              trend: trend,
              fmt: fmt,
              today: ref.watch(todayProvider),
              showFullHistory: true,
            ),
            const SizedBox(height: 12),
            InfoCard(
              title: 'Qualifying sessions',
              child: Column(
                children: [
                  if (trend.points.isEmpty)
                    const Text('No qualifying sessions yet.'),
                  for (final point in trend.points.reversed)
                    MmListRow(
                      key: ValueKey('strength-session-${point.workoutId}'),
                      title: Fmt.longDate(point.date),
                      subtitle:
                          'Best set e1RM ${fmt.weight(point.estimateKg)} · '
                          'smoothed ${fmt.weight(point.trendKg)}',
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Chart points use the latest qualifying session on each date. '
              'Every qualifying session is listed above. RIR not recorded '
              'counts as 0; sets above 12 effective reps and RIR 5+ are excluded.',
            ),
          ],
        ],
      ),
    );
  }
}
