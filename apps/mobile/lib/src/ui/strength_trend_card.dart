import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../charts/history_chart.dart';
import '../charts/history_series.dart';
import '../charts/history_series_kind.dart';
import '../format/fmt.dart';
import 'info_card.dart';
import 'mm_button.dart';
import 'mm_button_kind.dart';

/// The same dated strength evidence in Progress and a lift's detail screen.
class StrengthTrendCard extends StatelessWidget {
  const StrengthTrendCard({
    required this.trend,
    required this.fmt,
    required this.today,
    this.onHistory,
    this.showFullHistory = false,
    super.key,
  });

  final StrengthTrend trend;
  final Fmt fmt;
  final CalendarDate today;
  final VoidCallback? onHistory;
  final bool showFullHistory;

  @override
  Widget build(BuildContext context) {
    final points = trend.points;
    final latest = points.lastOrNull;
    final text = Theme.of(context).textTheme;
    String changeLabel(int weeks) {
      final change = trend.changeOverDays(weeks * 7);
      return '$weeks weeks: ${change == null ? 'Not enough history' : fmt.weightDelta(change)}';
    }

    return InfoCard(
      title: trend.name,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (trend.exercise == null)
            const Text(
              'Exercise details were deleted. Logged sets are preserved, but '
              'estimates need the original resistance type.',
            )
          else if (latest == null)
            const Text(
              'No usable estimate yet. Log a finished workout with positive '
              'resistance and at most 12 reps including reps in reserve. '
              'RIR 5+ is not an exact count.',
            )
          else ...[
            Text(fmt.weight(latest.trendKg), style: text.headlineSmall),
            Text(
              'Smoothed e1RM · ${Fmt.longDate(latest.date)}',
              style: text.bodySmall,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 24,
              runSpacing: 8,
              children: [
                for (final weeks in [4, 12]) Text(changeLabel(weeks)),
              ],
            ),
            const SizedBox(height: 16),
            HistoryChart(
              today: today,
              days: showFullHistory && points.first.date.daysUntil(today) >= 91
                  ? points.first.date.daysUntil(today) + 1
                  : 91,
              unit: fmt.weightUnit,
              series: [
                HistorySeries(
                  label: 'Session best e1RM',
                  kind: HistorySeriesKind.target,
                  dashed: true,
                  connectRecordedPoints: true,
                  maximumGapDays: 28,
                  values: {
                    for (final point in points)
                      point.date: fmt.weightFromKg(point.estimateKg),
                  },
                ),
                HistorySeries(
                  label: 'Smoothed e1RM',
                  kind: HistorySeriesKind.estimate,
                  connectRecordedPoints: true,
                  maximumGapDays: 28,
                  values: {
                    for (final point in points)
                      point.date: fmt.weightFromKg(point.trendKg),
                  },
                ),
              ],
            ),
            if (points.length == 1) ...[
              const SizedBox(height: 8),
              const Text(
                'One qualifying session. More sessions are needed for a trend.',
              ),
            ],
          ],
          if (trend.exercise?.load == ExerciseLoad.bodyweight) ...[
            const SizedBox(height: 8),
            const Text(
              'Uses total bodyweight plus added or assisted weight. A weigh-in '
              'on or before each session, no more than 7 days old, is required.',
            ),
          ],
          const SizedBox(height: 8),
          Text(
            'Estimated one-rep max is a comparison tool, not a prediction of '
            'a real max. The line averages up to 3 recent sessions. '
            'Changes end at the latest qualifying session.',
            style: text.bodySmall,
          ),
          if (onHistory != null) ...[
            const SizedBox(height: 12),
            MmButton(
              label: 'Session history',
              kind: MmButtonKind.secondary,
              onPressed: onHistory,
            ),
          ],
        ],
      ),
    );
  }
}
