import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Paints the horizon arc: a shallow orbital curve, a filled part, and a body
/// dot at the progress point. Past the end (progress above 1) the dot hollows
/// and the arc stays full.
class HorizonArcPainter extends CustomPainter {
  const HorizonArcPainter({
    required this.progress,
    required this.track,
    required this.fill,
    required this.surface,
    this.glow,
  });

  static const stroke = 8.0;
  static const dotRadius = 6.0;
  static const inset = dotRadius + 2;

  final double progress;
  final Color track;
  final Color fill;

  /// Behind the dot, so a hollow dot is hollow rather than see-through.
  final Color surface;
  final Color? glow;

  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width - inset * 2;
    final sagitta = size.height - inset * 2;
    final radius = (width * width / 4 + sagitta * sagitta) / (2 * sagitta);
    final center = Offset(size.width / 2, inset + radius);
    final half = math.asin((width / 2) / radius);
    final start = -math.pi / 2 - half;
    final sweep = 2 * half;
    final rect = Rect.fromCircle(center: center, radius: radius);

    Paint line(Color color) => Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(rect, start, sweep, false, line(track));
    final shown = progress.clamp(0.0, 1.0);
    if (shown > 0) {
      canvas.drawArc(rect, start, sweep * shown, false, line(fill));
    }

    final angle = start + sweep * shown;
    final dot = center + Offset(math.cos(angle), math.sin(angle)) * radius;
    final halo = glow;
    if (halo != null) {
      canvas.drawCircle(
        dot,
        dotRadius + 4,
        Paint()
          ..color = halo
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
      );
    }
    if (progress > 1) {
      canvas.drawCircle(dot, dotRadius, Paint()..color = surface);
      canvas.drawCircle(dot, dotRadius - 1, line(fill)..strokeWidth = 2);
    } else {
      canvas.drawCircle(dot, dotRadius, Paint()..color = fill);
    }
  }

  @override
  bool shouldRepaint(HorizonArcPainter old) =>
      old.progress != progress ||
      old.track != track ||
      old.fill != fill ||
      old.surface != surface ||
      old.glow != glow;
}
