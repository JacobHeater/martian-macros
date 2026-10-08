import 'package:flutter/material.dart';
import 'package:mm_engine/mm_engine.dart';

import '../charts/trend_sparkline.dart';
import '../charts/trend_stats.dart';
import '../format/fmt.dart';
import '../ui/info_card.dart';
import '../ui/number_entry_card.dart';

/// Trend weight with its 30-day line, or, when there is no weigh-in today, a
/// field to enter one.
class WeightCard extends StatelessWidget {
  const WeightCard({
    required this.trend,
    required this.weighedInToday,
    required this.fmt,
    required this.onSaveWeight,
    required this.onTap,
    super.key,
  });

  final List<WeightTrendPoint> trend;
  final bool weighedInToday;
  final Fmt fmt;
  final Future<void> Function(double kg) onSaveWeight;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    if (!weighedInToday || trend.isEmpty) {
      return NumberEntryCard(
        title: 'Today’s weigh-in',
        unit: fmt.weightUnit,
        fieldKey: 'dashboard-weigh-in',
        initial: null,
        hint: 'First thing in the morning, after the bathroom.',
        onSave: (value) => onSaveWeight(fmt.weightToKg(value)),
      );
    }
    return InfoCard(
      title: 'Weight',
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TrendStats(trend: trend, fmt: fmt),
          const SizedBox(height: 12),
          TrendSparkline(trend: trend),
        ],
      ),
    );
  }
}
