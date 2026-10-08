import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';

/// One row of a list: a title with optional detail, icon and trailing widget.
class MmListRow extends StatelessWidget {
  const MmListRow({
    required this.title,
    this.subtitle,
    this.detail,
    this.leadingIcon,
    this.danger = false,
    this.trailing,
    this.onTap,
    this.dense = false,
    super.key,
  });

  final String title;
  final String? subtitle;

  /// A widget shown under the title instead of [subtitle] (a slider, say).
  final Widget? detail;
  final IconData? leadingIcon;

  /// Marks a destructive row (erase): its icon uses the danger color.
  final bool danger;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool dense;

  @override
  Widget build(BuildContext context) => ListTile(
    dense: dense,
    leading: leadingIcon == null
        ? null
        : Icon(leadingIcon, color: danger ? context.mm.danger : null),
    title: Text(title),
    subtitle: detail ?? (subtitle == null ? null : Text(subtitle!)),
    trailing: trailing,
    onTap: onTap,
  );
}
