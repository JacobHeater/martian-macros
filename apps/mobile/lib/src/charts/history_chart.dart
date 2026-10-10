import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../theme/mm_colors_context.dart';
import 'history_series.dart';
import 'history_series_kind.dart';

/// Missing dates break lines rather than representing zero observations.
class HistoryChart extends StatelessWidget {
  const HistoryChart({
    super.key,
    required this.series,
    required this.today,
    required this.days,
    required this.unit,
    this.minimum,
    this.maximum,
  });

  final List<HistorySeries> series;
  final CalendarDate today;
  final int days;
  final String unit;
  final double? minimum;
  final double? maximum;

  @override
  Widget build(BuildContext context) {
    final start = today.addDays(1 - days);
    final values = [
      for (final item in series)
        for (final entry in item.values.entries)
          if (!entry.key.isBefore(start) && !entry.key.isAfter(today))
            entry.value,
    ];
    if (values.isEmpty) {
      return const SizedBox(
        height: 100,
        child: Center(child: Text('No records in this range yet.')),
      );
    }
    Color color(HistorySeriesKind kind) => switch (kind) {
      HistorySeriesKind.energy => context.mm.energy,
      HistorySeriesKind.target => context.mm.text2,
      HistorySeriesKind.protein => context.mm.protein,
      HistorySeriesKind.estimate => context.mm.ion,
      HistorySeriesKind.measurement => context.mm.carbs,
      HistorySeriesKind.recovery => context.mm.fat,
    };
    final low = minimum ?? math.max(0, values.reduce(math.min) * 0.85);
    final high = maximum ?? math.max(low + 1, values.reduce(math.max) * 1.1);
    final interval = (high - low) / 3;
    final text = Theme.of(context).textTheme.labelSmall;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 4,
          children: [
            for (final item in series)
              Text(
                '${item.dashed ? '– –' : '●'} ${item.label}',
                style: text?.copyWith(color: color(item.kind)),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Semantics(
          image: true,
          label:
              '$unit history, ${Fmt.shortDay(start)} to '
              '${Fmt.shortDay(today)}. '
              '${series.map((s) => '${s.label}: ${s.values.entries.where((e) => !e.key.isBefore(start) && !e.key.isAfter(today)).length} recorded points').join('. ')}',
          child: ExcludeSemantics(
            child: SizedBox(
              height: 150,
              child: LineChart(
                LineChartData(
                  minX: 0,
                  maxX: (days - 1).toDouble(),
                  minY: low,
                  maxY: high,
                  lineTouchData: const LineTouchData(enabled: false),
                  borderData: FlBorderData(show: false),
                  gridData: FlGridData(
                    drawVerticalLine: false,
                    horizontalInterval: interval,
                    getDrawingHorizontalLine: (_) =>
                        FlLine(color: context.mm.outline, strokeWidth: 1),
                  ),
                  titlesData: FlTitlesData(
                    topTitles: const AxisTitles(),
                    rightTitles: const AxisTitles(),
                    leftTitles: AxisTitles(
                      axisNameWidget: Text(unit, style: text),
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 42,
                        interval: interval,
                        getTitlesWidget: (value, meta) =>
                            value == meta.min || value == meta.max
                            ? const SizedBox.shrink()
                            : Text(Fmt.whole(value), style: text),
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 28,
                        interval: (days - 1) / 2,
                        getTitlesWidget: (value, meta) => SideTitleWidget(
                          meta: meta,
                          fitInside: SideTitleFitInsideData(
                            enabled: true,
                            axisPosition: meta.axisPosition,
                            parentAxisSize: meta.parentAxisSize,
                            distanceFromEdge: 0,
                          ),
                          child: Text(
                            Fmt.shortDay(start.addDays(value.round())),
                            style: text,
                          ),
                        ),
                      ),
                    ),
                  ),
                  lineBarsData: [
                    for (final item in series)
                      LineChartBarData(
                        spots: [
                          if (item.connectRecordedPoints)
                            ...(item.values.entries
                                    .where(
                                      (e) =>
                                          !e.key.isBefore(start) &&
                                          !e.key.isAfter(today),
                                    )
                                    .toList()
                                  ..sort((a, b) => a.key.compareTo(b.key)))
                                .map(
                                  (e) => FlSpot(
                                    start.daysUntil(e.key).toDouble(),
                                    e.value,
                                  ),
                                )
                          else
                            for (var i = 0; i < days; i++)
                              if (item.values[start.addDays(i)]
                                  case final value?)
                                FlSpot(i.toDouble(), value)
                              else
                                FlSpot.nullSpot,
                        ],
                        color: color(item.kind),
                        barWidth: item.dashed ? 1.5 : 2.5,
                        dashArray: item.dashed ? [4, 4] : null,
                        dotData: FlDotData(show: !item.dashed),
                      ),
                  ],
                ),
                duration: Duration.zero,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
