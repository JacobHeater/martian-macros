import 'package:flutter/material.dart';

/// A labeled, full-width dropdown field.
class MmDropdown<T> extends StatelessWidget {
  const MmDropdown({
    required this.label,
    required this.initialValue,
    required this.items,
    required this.onChanged,
    super.key,
  });

  final String label;
  final T initialValue;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?>? onChanged;

  @override
  Widget build(BuildContext context) => DropdownButtonFormField<T>(
    initialValue: initialValue,
    isExpanded: true,
    decoration: InputDecoration(labelText: label),
    items: items,
    onChanged: onChanged,
  );
}
