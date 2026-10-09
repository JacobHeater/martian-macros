import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../theme/mm_colors_context.dart';

class TrendChart extends StatelessWidget {
  const TrendChart({
    super.key,
    required this.trend,
    required this.weights,
    required this.today,
    required this.rangeDays,
    required this.fmt,
    this.weightEvents = const [],
  });

  final List<WeightTrendPoint> trend;
  final List<WeightObservation> weights;
  final CalendarDate today;
  final int rangeDays;
  final Fmt fmt;
  final List<WeightEvent> weightEvents;

  @override
  Widget build(BuildContext context) {
    final mm = context.mm;
    final text = Theme.of(context).textTheme;
    final start = today.addDays(1 - rangeDays);

    double x(CalendarDate d) => start.daysUntil(d).toDouble();
    final points = [
      for (final p in trend)
        if (!p.date.isBefore(start)) p,
    ];
    final raw = [
      for (final w in weights)
        if (!w.date.isBefore(start))
          FlSpot(x(w.date), fmt.weightFromKg(w.weightKg)),
    ];
    final eventLines = [
      for (final event in weightEvents)
        if (!event.date.isBefore(start) && !event.date.isAfter(today))
          VerticalLine(
            x: x(event.date),
            color: mm.caution,
            strokeWidth: 1,
            dashArray: [3, 3],
          ),
    ];
    if (points.isEmpty) {
      return const Center(child: Text('No weigh-ins in this range.'));
    }

    FlSpot spot(WeightTrendPoint p, double sigmas) => FlSpot(
      x(p.date),
      fmt.weightFromKg(p.levelKg + sigmas * p.levelSigmaKg),
    );
    final line = [for (final p in points) spot(p, 0)];
    final upper = [for (final p in points) spot(p, 2)];
    final lower = [for (final p in points) spot(p, -2)];

    final ys = [
      ...raw.map((s) => s.y),
      ...upper.map((s) => s.y),
      ...lower.map((s) => s.y),
    ];
    final minY = ys.reduce(math.min);
    final maxY = ys.reduce(math.max);
    final pad = math.max((maxY - minY) * 0.1, 0.5);

    LineChartBarData hidden(List<FlSpot> spots) => LineChartBarData(
      spots: spots,
      color: Colors.transparent,
      barWidth: 0,
      dotData: const FlDotData(show: false),
    );

    return LineChart(
      LineChartData(
        minX: 0,
        maxX: (rangeDays - 1).toDouble(),
        minY: minY - pad,
        maxY: maxY + pad,
        lineTouchData: const LineTouchData(enabled: false),
        extraLinesData: ExtraLinesData(verticalLines: eventLines),
        gridData: FlGridData(
          drawVerticalLine: false,
          getDrawingHorizontalLine: (_) =>
              FlLine(color: mm.outline, strokeWidth: 1),
        ),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(),
          rightTitles: const AxisTitles(),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) =>
                  value == meta.min || value == meta.max
                  ? const SizedBox.shrink()
                  : Text(value.toStringAsFixed(0), style: text.labelSmall),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 24,
              interval: rangeDays / 3,
              getTitlesWidget: (value, meta) => value == meta.max
                  ? const SizedBox.shrink()
                  : Text(
                      Fmt.shortDay(start.addDays(value.round())),
                      style: text.labelSmall,
                    ),
            ),
          ),
        ),
        betweenBarsData: [
          BetweenBarsData(
            fromIndex: 0,
            toIndex: 1,
            color: mm.ion.withValues(alpha: 0.14),
          ),
        ],
        lineBarsData: [
          hidden(lower),
          hidden(upper),
          LineChartBarData(
            spots: line,
            color: mm.ion,
            barWidth: 3,
            isCurved: true,
            preventCurveOverShooting: true,
            dotData: const FlDotData(show: false),
          ),
          LineChartBarData(
            spots: raw,
            color: Colors.transparent,
            barWidth: 0,
            dotData: FlDotData(
              getDotPainter: (_, _, _, _) => FlDotCirclePainter(
                radius: 2.5,
                color: mm.text2,
                strokeWidth: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
