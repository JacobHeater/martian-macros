import 'package:flutter/material.dart';

/// A horizontal progress bar for an amount against a target (0 to 1), with
/// full-round ends.
class MmProgressBar extends StatelessWidget {
  const MmProgressBar({
    required this.value,
    this.color,
    this.height = 8,
    super.key,
  });

  final double value;

  /// Defaults to the energy color.
  final Color? color;
  final double height;

  @override
  Widget build(BuildContext context) => LinearProgressIndicator(
    value: value,
    color: color,
    minHeight: height,
    borderRadius: BorderRadius.circular(height / 2),
  );
}
