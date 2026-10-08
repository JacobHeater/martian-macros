import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import '../theme/mm_glow.dart';
import '../theme/mm_radius.dart';

/// The screen's primary action, floating above the content. The only Ember
/// fill on a screen.
class MmFab extends StatelessWidget {
  const MmFab({
    required this.label,
    required this.icon,
    required this.onPressed,
    super.key,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(MmRadius.group),
      boxShadow: MmGlow.fab(context),
    ),
    child: FloatingActionButton.extended(
      elevation: 0,
      focusElevation: 0,
      hoverElevation: 0,
      highlightElevation: 0,
      onPressed: onPressed,
      icon: Icon(icon),
      label: Text(
        label,
        style: Theme.of(context).textTheme.titleMedium
            ?.copyWith(color: context.mm.onEmber),
      ),
    ),
  );
}
