import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../ui/info_card.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_spinner.dart';
import '../ui/strength_trend_card.dart';
import 'strength_history_screen.dart';
import 'strength_lifts_screen.dart';
import 'strength_trends_provider.dart';

class StrengthSection extends ConsumerWidget {
  const StrengthSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fmt = Fmt(ref.watch(setupProvider).requireValue!.unitSystem);
    final today = ref.watch(todayProvider);
    return ref
        .watch(strengthTrendsProvider)
        .when(
          loading: () =>
              const InfoCard(title: 'Strength trends', child: MmSpinner()),
          error: (_, _) => InfoCard(
            title: 'Strength trends',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Could not load strength history. Your logged sets are not changed.',
                ),
                const SizedBox(height: 8),
                MmButton(
                  label: 'Retry strength history',
                  onPressed: () {
                    ref.invalidate(workoutsProvider);
                    ref.invalidate(weightsProvider);
                    ref.invalidate(customExercisesProvider);
                  },
                ),
              ],
            ),
          ),
          data: (trends) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InfoCard(
                title: 'Strength trends',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      trends.isEmpty
                          ? 'Finish a workout in Train to start your strength history.'
                          : 'Your most-trained lifts over the last 90 days. '
                                'Each point comes from a finished workout.',
                    ),
                    if (trends.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      MmButton(
                        label: 'All lift histories',
                        kind: MmButtonKind.secondary,
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const StrengthLiftsScreen(),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              for (final trend
                  in trends.where((t) => t.recentSessions > 0).take(4)) ...[
                const SizedBox(height: 12),
                StrengthTrendCard(
                  key: ValueKey('strength-${trend.exercise.id}'),
                  trend: trend,
                  fmt: fmt,
                  today: today,
                  onHistory: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) =>
                          StrengthHistoryScreen(exerciseId: trend.exercise.id),
                    ),
                  ),
                ),
              ],
              if (trends.isNotEmpty &&
                  trends.every((t) => t.recentSessions == 0))
                const Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: Text(
                    'No qualifying sessions in the last 90 days. Open a lift history to see earlier sessions or why an estimate is unavailable.',
                  ),
                ),
            ],
          ),
        );
  }
}
