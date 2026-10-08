import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import '../theme/mm_glow.dart';
import 'horizon_arc_painter.dart';

/// The app's signature graphic: calories eaten as a body travelling along a
/// shallow arc. [progress] is eaten over target; past 1 the dot hollows.
class HorizonArc extends StatelessWidget {
  const HorizonArc({
    required this.progress,
    required this.semanticsLabel,
    super.key,
  });

  final double progress;

  /// What the arc says, for a screen reader (the arc itself is drawn).
  final String semanticsLabel;

  @override
  Widget build(BuildContext context) => Semantics(
    label: semanticsLabel,
    image: true,
    child: ExcludeSemantics(
      child: LayoutBuilder(
        builder: (context, box) => CustomPaint(
          size: Size(
            box.maxWidth,
            box.maxWidth * 0.18 + HorizonArcPainter.inset * 2,
          ),
          painter: HorizonArcPainter(
            progress: progress,
            track: context.mm.track,
            fill: context.mm.energy,
            surface: context.mm.surface,
            glow: MmGlow.body(context),
          ),
        ),
      ),
    ),
  );
}
