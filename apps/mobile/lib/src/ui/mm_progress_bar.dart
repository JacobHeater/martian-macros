import 'package:flutter/material.dart';

/// A horizontal progress bar for an amount against a target (0 to 1).
class MmProgressBar extends StatelessWidget {
  const MmProgressBar({required this.value, super.key});

  final double value;

  @override
  Widget build(BuildContext context) => LinearProgressIndicator(
    value: value,
    minHeight: 8,
    borderRadius: BorderRadius.circular(4),
  );
}
