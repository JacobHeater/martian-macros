import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import '../theme/mm_glow.dart';
import '../theme/mm_radius.dart';
import 'hero_backdrop_painter.dart';

/// The one hero surface of a screen: a grouping surface with limb glow and
/// orbit hairlines behind its content. At most one per screen.
class MmHeroSurface extends StatelessWidget {
  const MmHeroSurface({required this.child, this.onTap, super.key});

  final Widget child;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(MmRadius.group),
      side: BorderSide(color: context.mm.outline),
    );
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: ShapeDecoration(shape: shape, shadows: MmGlow.card(context)),
      child: Material(
        color: context.mm.surface,
        shape: shape,
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Positioned.fill(
              child: ExcludeSemantics(
                child: CustomPaint(
                  painter: HeroBackdropPainter(
                    glow: MmGlow.limb(context),
                    orbit: MmGlow.orbit(context),
                  ),
                ),
              ),
            ),
            InkWell(
              onTap: onTap,
              child: Padding(padding: const EdgeInsets.all(24), child: child),
            ),
          ],
        ),
      ),
    );
  }
}
