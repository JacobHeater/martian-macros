import 'package:flutter/material.dart';

/// The app's slider.
class MmSlider extends StatelessWidget {
  const MmSlider({
    required this.value,
    required this.onChanged,
    this.min = 0,
    this.max = 1,
    this.divisions,
    this.label,
    super.key,
  });

  final double value;
  final double min;
  final double max;
  final int? divisions;
  final String? label;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) => Slider(
    value: value,
    min: min,
    max: max,
    divisions: divisions,
    label: label,
    onChanged: onChanged,
  );
}
