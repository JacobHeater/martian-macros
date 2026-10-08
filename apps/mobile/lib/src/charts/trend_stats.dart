import 'package:flutter/material.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../theme/mm_colors_context.dart';

class TrendStats extends StatelessWidget {
  const TrendStats({super.key, required this.trend, required this.fmt});

  final List<WeightTrendPoint> trend;
  final Fmt fmt;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final last = trend.last;
    final weekAgo = trend.length > 7 ? trend[trend.length - 8] : null;
    Widget stat(String label, String value) => Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: text.labelMedium?.copyWith(color: context.mm.text2),
          ),
          Text(value, style: text.titleLarge),
        ],
      ),
    );
    return Row(
      children: [
        stat('Trend weight', fmt.weight(last.levelKg)),
        stat(
          'Last 7 days',
          weekAgo == null
              ? '—'
              : fmt.weightDelta(last.levelKg - weekAgo.levelKg),
        ),
        stat(
          'Since start',
          trend.length < 2
              ? '—'
              : fmt.weightDelta(last.levelKg - trend.first.levelKg),
        ),
      ],
    );
  }
}
