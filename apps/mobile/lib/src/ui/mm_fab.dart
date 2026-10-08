import 'package:flutter/material.dart';

/// The screen's primary action, floating above the content.
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
  Widget build(BuildContext context) => FloatingActionButton.extended(
    onPressed: onPressed,
    icon: Icon(icon),
    label: Text(label),
  );
}
