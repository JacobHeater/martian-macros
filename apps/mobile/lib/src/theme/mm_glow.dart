import 'package:flutter/material.dart';

import 'mm_colors_context.dart';

/// The few translucent effects of the space signature (design/visual-language.md,
/// "The space signature (budget)"). They live here so a screen can never
/// invent its own glow.
abstract final class MmGlow {
  static bool _dark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  /// Radial light from the top-trailing corner of a hero surface.
  static Color limb(BuildContext context) =>
      context.mm.ion.withValues(alpha: _dark(context) ? 0.12 : 0.08);

  /// Concentric hairlines behind the hero figures.
  static Color orbit(BuildContext context) =>
      context.mm.text.withValues(alpha: _dark(context) ? 0.06 : 0.05);

  /// The glow around the body dot on the horizon arc (dark only).
  static Color? body(BuildContext context) =>
      _dark(context) ? context.mm.ion.withValues(alpha: 0.5) : null;

  /// The resting shadow of a card in light mode; none in dark.
  static List<BoxShadow> card(BuildContext context) => _dark(context)
      ? const []
      : [
          BoxShadow(
            color: context.mm.text.withValues(alpha: 0.06),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ];
}
