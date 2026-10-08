import 'package:flutter/material.dart';

/// A grouping surface: one card for one idea.
class MmSurface extends StatelessWidget {
  const MmSurface({
    required this.child,
    this.padded = true,
    this.clip = false,
    super.key,
  });

  final Widget child;

  /// Inset the content by the standard card padding.
  final bool padded;

  /// Clip the content to the surface's rounded corners (for edge-to-edge rows).
  final bool clip;

  @override
  Widget build(BuildContext context) => Card(
    margin: const EdgeInsets.only(bottom: 12),
    clipBehavior: clip ? Clip.antiAlias : Clip.none,
    child: padded
        ? Padding(padding: const EdgeInsets.all(16), child: child)
        : child,
  );
}
