import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'mini_trend_painter.dart';

/// A small line of a few values on a fixed scale, oldest on the left. The
/// drawing is decoration: its meaning is carried by [semanticsLabel] and the
/// text beside it.
class MiniTrend extends StatelessWidget {
  const MiniTrend({
    required this.values,
    required this.min,
    required this.max,
    required this.slots,
    required this.semanticsLabel,
    super.key,
  });

  final List<double> values;
  final double min;
  final double max;

  /// How many points the width allows for.
  final int slots;
  final String semanticsLabel;

  @override
  Widget build(BuildContext context) => Semantics(
    label: semanticsLabel,
    image: true,
    child: ExcludeSemantics(
      child: CustomPaint(
        size: const Size(96, 24),
        painter: MiniTrendPainter(
          values: values,
          min: min,
          max: max,
          slots: slots,
          line: context.mm.info,
          track: context.mm.outline,
        ),
      ),
    ),
  );
}
