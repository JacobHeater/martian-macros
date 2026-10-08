import 'package:flutter/material.dart';

/// A labelled on/off setting.
class MmSwitchRow extends StatelessWidget {
  const MmSwitchRow({
    required this.title,
    required this.value,
    required this.onChanged,
    this.subtitle,
    this.flush = false,
    super.key,
  });

  final String title;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  /// No horizontal padding, for use inside a padded group.
  final bool flush;

  @override
  Widget build(BuildContext context) => SwitchListTile(
    contentPadding: flush ? EdgeInsets.zero : null,
    title: Text(title),
    subtitle: subtitle == null ? null : Text(subtitle!),
    value: value,
    onChanged: onChanged,
  );
}
