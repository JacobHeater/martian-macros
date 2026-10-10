import 'package:flutter/material.dart';

/// Draws [values] between [min] and [max] as a small line with a dot at
/// each point, over a faint baseline.
class MiniTrendPainter extends CustomPainter {
  const MiniTrendPainter({
    required this.values,
    required this.min,
    required this.max,
    required this.slots,
    required this.line,
    required this.track,
  });

  final List<double> values;
  final double min;
  final double max;

  /// How many points the width is divided for, so a short series does not
  /// stretch.
  final int slots;
  final Color line;
  final Color track;

  static const _dot = 2.5;

  @override
  void paint(Canvas canvas, Size size) {
    const top = _dot;
    final bottom = size.height - _dot;
    canvas.drawLine(
      Offset(0, bottom),
      Offset(size.width, bottom),
      Paint()
        ..color = track
        ..strokeWidth = 1,
    );
    if (values.isEmpty) return;
    final step = slots <= 1 ? 0.0 : (size.width - 2 * _dot) / (slots - 1);
    Offset at(int i) {
      final share = max == min ? 0.5 : (values[i] - min) / (max - min);
      return Offset(_dot + step * i, bottom - (bottom - top) * share);
    }

    final stroke = Paint()
      ..color = line
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    for (var i = 1; i < values.length; i++) {
      canvas.drawLine(at(i - 1), at(i), stroke);
    }
    final fill = Paint()..color = line;
    for (var i = 0; i < values.length; i++) {
      canvas.drawCircle(at(i), _dot, fill);
    }
  }

  @override
  bool shouldRepaint(MiniTrendPainter old) =>
      old.values != values ||
      old.min != min ||
      old.max != max ||
      old.slots != slots ||
      old.line != line ||
      old.track != track;
}
