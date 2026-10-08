import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/info_card.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/number_entry_card.dart';
import 'progress_screen.dart';
import '../charts/trend_chart.dart';
import '../charts/trend_stats.dart';
import 'waist_summary.dart';

class ProgressScreenState extends ConsumerState<ProgressScreen> {
  var _rangeDays = 30;

  @override
  Widget build(BuildContext context) {
    final setup = ref.watch(setupProvider).value;
    if (setup == null) return const SizedBox.shrink();
    final fmt = Fmt(setup.unitSystem);
    final today = ref.watch(todayProvider);
    final weights = ref.watch(weightsProvider).value ?? const [];
    final waist = ref.watch(waistProvider).value ?? const [];
    final trend = ref.watch(coachProvider)?.trend ?? const [];

    WeightObservation? todays;
    for (final w in weights) {
      if (w.date == today) todays = w;
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        NumberEntryCard(
          key: ValueKey('weight-${todays?.weightKg}-${fmt.units}'),
          title: 'Today’s weigh-in',
          unit: fmt.weightUnit,
          fieldKey: 'weigh-in',
          initial: todays == null
              ? null
              : fmt.weightFromKg(todays.weightKg).toStringAsFixed(1),
          hint: 'First thing in the morning, after the bathroom.',
          onSave: (value) => ref
              .read(weightWriterProvider)
              .saveWeight(today, fmt.weightToKg(value)),
        ),
        InfoCard(
          title: 'Weight trend',
          trailing: MmSegmented<int>(
            compact: true,
            segments: const [MmSegment(30, '30d'), MmSegment(90, '90d')],
            selected: {_rangeDays},
            onChanged: (s) => setState(() => _rangeDays = s.first),
          ),
          child: trend.isEmpty
              ? const Text('Log a weigh-in to start your trend.')
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TrendStats(trend: trend, fmt: fmt),
                    const SizedBox(height: 16),
                    Semantics(
                      label:
                          'Weight trend over the last $_rangeDays days. '
                          'Trend weight ${fmt.weight(trend.last.levelKg)}, '
                          'from ${weights.length} '
                          'weigh-in${weights.length == 1 ? '' : 's'}.',
                      child: ExcludeSemantics(
                        child: SizedBox(
                          height: 220,
                          child: TrendChart(
                            trend: trend,
                            weights: weights,
                            today: today,
                            rangeDays: _rangeDays,
                            fmt: fmt,
                          ),
                        ),
                      ),
                    ),
                    if (weights.length < 2) ...[
                      const SizedBox(height: 8),
                      const Text('A trend needs more weigh-ins.'),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      'Dots are weigh-ins. The line is your trend with water '
                      'swings filtered out; the band is its uncertainty. '
                      'Daily jumps inside the band are noise, not fat.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
        ),
        NumberEntryCard(
          key: ValueKey('waist-${waist.length}-${fmt.units}'),
          title: 'Waist',
          unit: fmt.lengthUnit,
          fieldKey: 'waist',
          initial: null,
          hint: waist.isEmpty
              ? 'Measure at the navel, relaxed. Take three and enter the '
                    'middle one. Once a week is plenty.'
              : waistSummary(waist, fmt),
          onSave: (value) => ref
              .read(waistWriterProvider)
              .saveWaist(today, fmt.lengthToCm(value)),
        ),
      ],
    );
  }
}
