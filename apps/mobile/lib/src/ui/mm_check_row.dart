import 'package:flutter/material.dart';

/// A labelled checkbox, for "tick anything that applies" lists.
class MmCheckRow extends StatelessWidget {
  const MmCheckRow({
    required this.title,
    required this.value,
    required this.onChanged,
    super.key,
  });

  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) => CheckboxListTile(
    contentPadding: EdgeInsets.zero,
    controlAffinity: ListTileControlAffinity.leading,
    title: Text(title),
    value: value,
    onChanged: (v) => onChanged(v ?? false),
  );
}
