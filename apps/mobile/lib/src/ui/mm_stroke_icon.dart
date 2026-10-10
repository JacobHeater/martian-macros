import 'package:flutter/material.dart';

import 'mm_stroke_icon_kind.dart';
import 'mm_stroke_icon_painter.dart';

/// Resolution-independent paths, with the same 24-unit geometry as an SVG.
class MmStrokeIcon extends StatelessWidget {
  const MmStrokeIcon({required this.kind, super.key});

  final MmStrokeIconKind kind;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 16,
    height: 16,
    child: CustomPaint(
      painter: MmStrokeIconPainter(
        kind: kind,
        color:
            IconTheme.of(context).color ??
            Theme.of(context).colorScheme.onSurface,
      ),
    ),
  );
}
