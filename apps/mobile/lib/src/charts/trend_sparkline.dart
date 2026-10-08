import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:mm_engine/mm_engine.dart';

import '../theme/mm_colors_context.dart';

/// The small trend line: the same line and uncertainty band as the full
/// chart, with no axes and no dots (MM-107). Its meaning is carried by the
/// text beside it; the drawing is excluded from screen readers.
class TrendSparkline extends StatelessWidget {
  const TrendSparkline({required this.trend, this.days = 30, super.key});

  final List<WeightTrendPoint> trend;
  final int days;

  @override
  Widget build(BuildContext context) {
    final mm = context.mm;
    final points = trend.length > days
        ? trend.sublist(trend.length - days)
        : trend;
    if (points.length < 2) return const SizedBox(height: 56);
    FlSpot spot(int i, double sigmas) => FlSpot(
      i.toDouble(),
      points[i].levelKg + sigmas * points[i].levelSigmaKg,
    );
    final line = [for (var i = 0; i < points.length; i++) spot(i, 0)];
    final upper = [for (var i = 0; i < points.length; i++) spot(i, 2)];
    final lower = [for (var i = 0; i < points.length; i++) spot(i, -2)];
    LineChartBarData hidden(List<FlSpot> spots) => LineChartBarData(
      spots: spots,
      color: Colors.transparent,
      barWidth: 0,
      dotData: const FlDotData(show: false),
    );
    final ys = [...upper, ...lower].map((s) => s.y);
    final minY = ys.reduce((a, b) => a < b ? a : b);
    final maxY = ys.reduce((a, b) => a > b ? a : b);
    return ExcludeSemantics(
      child: SizedBox(
        height: 56,
        child: LineChart(
          LineChartData(
            minX: 0,
            maxX: (points.length - 1).toDouble(),
            minY: minY,
            maxY: maxY,
            lineTouchData: const LineTouchData(enabled: false),
            gridData: const FlGridData(show: false),
            borderData: FlBorderData(show: false),
            titlesData: const FlTitlesData(show: false),
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
                barWidth: 2.5,
                isCurved: true,
                preventCurveOverShooting: true,
                dotData: const FlDotData(show: false),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
