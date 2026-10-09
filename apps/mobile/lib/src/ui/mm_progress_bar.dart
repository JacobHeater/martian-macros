import 'dart:math' as math;

import 'package:flutter/material.dart';

/// A horizontal progress bar for an amount against a target (0 to 1), with
/// full-round ends.
class MmProgressBar extends StatelessWidget {
  const MmProgressBar({
    required this.value,
    this.color,
    this.markers = const [],
    this.height = 8,
    super.key,
  });

  final double value;

  /// Defaults to the energy color.
  final Color? color;
  final List<double> markers;
  final double height;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final width = constraints.maxWidth;
      return SizedBox(
        height: height,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(height / 2),
          child: Stack(
            fit: StackFit.expand,
            children: [
              LinearProgressIndicator(
                value: value,
                color: color,
                minHeight: height,
              ),
              for (final marker in markers)
                Positioned(
                  left: (width * marker)
                      .clamp(0.0, math.max(0.0, width - 2))
                      .toDouble(),
                  top: 0,
                  bottom: 0,
                  child: ColoredBox(
                    color: Theme.of(context).colorScheme.onSurface,
                    child: const SizedBox(width: 2),
                  ),
                ),
            ],
          ),
        ),
      );
    },
  );
}
