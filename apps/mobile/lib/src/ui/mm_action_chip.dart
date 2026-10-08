import 'package:flutter/material.dart';

/// A chip that performs a one-tap action (refill from a recent food).
class MmActionChip extends StatelessWidget {
  const MmActionChip({required this.label, required this.onPressed, super.key});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) =>
      ActionChip(label: Text(label), onPressed: onPressed);
}
