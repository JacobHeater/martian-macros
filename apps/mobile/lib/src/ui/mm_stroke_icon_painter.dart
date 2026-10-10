import 'package:flutter/material.dart';

import 'mm_stroke_icon_kind.dart';

/// Two-unit round strokes in a 24 by 24 coordinate system.
class MmStrokeIconPainter extends CustomPainter {
  const MmStrokeIconPainter({required this.kind, required this.color});

  final MmStrokeIconKind kind;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 24, size.height / 24);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final path = Path();
    switch (kind) {
      case MmStrokeIconKind.plus:
        path
          ..moveTo(12, 5)
          ..lineTo(12, 19)
          ..moveTo(5, 12)
          ..lineTo(19, 12);
      case MmStrokeIconKind.chevron:
        path
          ..moveTo(6, 9)
          ..lineTo(12, 15)
          ..lineTo(18, 9);
    }
    canvas.drawPath(path, paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(MmStrokeIconPainter oldDelegate) =>
      kind != oldDelegate.kind || color != oldDelegate.color;
}
