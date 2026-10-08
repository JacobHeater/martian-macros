import 'package:flutter/material.dart';

/// An icon-only button. The tooltip is required: it is the accessible name.
class MmIconButton extends StatelessWidget {
  const MmIconButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    super.key,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) =>
      IconButton(tooltip: tooltip, icon: Icon(icon), onPressed: onPressed);
}
