import 'package:flutter/material.dart';

/// One destination of [MmNavigationBar].
final class MmNavDestination {
  const MmNavDestination({
    required this.label,
    required this.icon,
    IconData? selectedIcon,
  }) : selectedIcon = selectedIcon ?? icon;

  final String label;
  final IconData icon;
  final IconData selectedIcon;
}
