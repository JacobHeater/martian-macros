import 'package:flutter/material.dart';

/// The limb glow and orbit hairlines behind a hero surface.
class HeroBackdropPainter extends CustomPainter {
  const HeroBackdropPainter({required this.glow, required this.orbit});

  final Color glow;
  final Color orbit;

  @override
  void paint(Canvas canvas, Size size) {
    final origin = Offset(size.width, 0);
    final reach = size.width * 0.6;
    canvas.drawCircle(
      origin,
      reach,
      Paint()
        ..shader = RadialGradient(colors: [glow, glow.withValues(alpha: 0)])
            .createShader(Rect.fromCircle(center: origin, radius: reach)),
    );
    final line = Paint()
      ..color = orbit
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    for (final fraction in const [0.38, 0.52, 0.66]) {
      canvas.drawCircle(origin, size.width * fraction, line);
    }
  }

  @override
  bool shouldRepaint(HeroBackdropPainter old) =>
      old.glow != glow || old.orbit != orbit;
}
