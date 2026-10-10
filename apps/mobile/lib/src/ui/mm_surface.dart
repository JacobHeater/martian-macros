import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'mm_surface_kind.dart';

/// A grouping surface: one card for one idea.
class MmSurface extends StatelessWidget {
  const MmSurface({
    required this.child,
    this.padded = true,
    this.clip = false,
    this.onTap,
    this.kind = MmSurfaceKind.standard,
    super.key,
  });

  final Widget child;

  /// Inset the content by the standard card padding.
  final bool padded;

  /// Clip the content to the surface's rounded corners (for edge-to-edge rows).
  final bool clip;

  /// Makes the whole surface tappable (a summary that opens its detail).
  final VoidCallback? onTap;
  final MmSurfaceKind kind;

  @override
  Widget build(BuildContext context) => Card(
    shape: kind == MmSurfaceKind.compact
        ? RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: context.mm.outline),
          )
        : null,
    margin: const EdgeInsets.only(bottom: 12),
    clipBehavior: clip || onTap != null ? Clip.antiAlias : Clip.none,
    child: InkWell(
      onTap: onTap,
      child: padded
          ? Padding(padding: const EdgeInsets.all(16), child: child)
          : child,
    ),
  );
}
