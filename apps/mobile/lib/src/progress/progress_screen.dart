import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format.dart';
import '../providers.dart';
import '../theme/mm_colors_context.dart';
import '../widgets.dart';
import '../repository_role_providers.dart';

class ProgressScreen extends ConsumerStatefulWidget {
  const ProgressScreen({super.key});

  @override
  ConsumerState<ProgressScreen> createState() => _ProgressState();
}

class _ProgressState extends ConsumerState<ProgressScreen> {
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
        _EntryCard(
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
          trailing: SegmentedButton<int>(
            showSelectedIcon: false,
            style: const ButtonStyle(visualDensity: VisualDensity.compact),
            segments: const [
              ButtonSegment(value: 30, label: Text('30d')),
              ButtonSegment(value: 90, label: Text('90d')),
            ],
            selected: {_rangeDays},
            onSelectionChanged: (s) => setState(() => _rangeDays = s.first),
          ),
          child: trend.isEmpty
              ? const Text('Log a weigh-in to start your trend.')
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _TrendStats(trend: trend, fmt: fmt),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 220,
                      child: _TrendChart(
                        trend: trend,
                        weights: weights,
                        today: today,
                        rangeDays: _rangeDays,
                        fmt: fmt,
                      ),
                    ),
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
        _EntryCard(
          key: ValueKey('waist-${waist.length}-${fmt.units}'),
          title: 'Waist',
          unit: fmt.lengthUnit,
          fieldKey: 'waist',
          initial: null,
          hint: waist.isEmpty
              ? 'Measure at the navel, relaxed. Take three and enter the '
                    'middle one. Once a week is plenty.'
              : _waistSummary(waist, fmt),
          onSave: (value) => ref
              .read(waistWriterProvider)
              .saveWaist(today, fmt.lengthToCm(value)),
        ),
      ],
    );
  }

  String _waistSummary(List<WaistObservation> waist, Fmt fmt) {
    final latest = waist.last;
    final change = latest.waistCm - waist.first.waistCm;
    final base =
        'Latest: ${fmt.length(latest.waistCm)} on ${Fmt.shortDay(latest.date)}';
    if (waist.length < 2) return '$base.';
    final v = fmt.lengthFromCm(change);
    final sign = v > 0 ? '+' : (v < 0 ? '−' : '');
    return '$base ($sign${v.abs().toStringAsFixed(1)} ${fmt.lengthUnit} '
        'since ${Fmt.shortDay(waist.first.date)}).';
  }
}

/// A one-number entry card (weigh-in, waist).
class _EntryCard extends StatefulWidget {
  const _EntryCard({
    required this.title,
    required this.unit,
    required this.fieldKey,
    required this.initial,
    required this.hint,
    required this.onSave,
    super.key,
  });

  final String title;
  final String unit;
  final String fieldKey;
  final String? initial;
  final String hint;
  final Future<void> Function(double value) onSave;

  @override
  State<_EntryCard> createState() => _EntryCardState();
}

class _EntryCardState extends State<_EntryCard> {
  late final _controller = TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final value = parseNumber(_controller.text);
    final changed = _controller.text != (widget.initial ?? '');
    return InfoCard(
      title: widget.title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  key: ValueKey('entry-${widget.fieldKey}'),
                  controller: _controller,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    suffixText: widget.unit,
                    isDense: true,
                  ),
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: 12),
              FilledButton(
                key: ValueKey('save-${widget.fieldKey}'),
                onPressed: value == null || value <= 0 || !changed
                    ? null
                    : () async {
                        final messenger = ScaffoldMessenger.of(context);
                        FocusScope.of(context).unfocus();
                        try {
                          await widget.onSave(value);
                        } on Exception {
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text('That value looks off. Check it.'),
                            ),
                          );
                        }
                      },
                child: const Text('Save'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(widget.hint, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _TrendStats extends StatelessWidget {
  const _TrendStats({required this.trend, required this.fmt});

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
          Text(label, style: text.labelMedium),
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

class _TrendChart extends StatelessWidget {
  const _TrendChart({
    required this.trend,
    required this.weights,
    required this.today,
    required this.rangeDays,
    required this.fmt,
  });

  final List<WeightTrendPoint> trend;
  final List<WeightObservation> weights;
  final CalendarDate today;
  final int rangeDays;
  final Fmt fmt;

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
