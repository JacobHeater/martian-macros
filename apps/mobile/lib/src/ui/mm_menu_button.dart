import 'package:flutter/material.dart';

import 'mm_menu_item.dart';

/// An icon that opens a short menu of choices.
class MmMenuButton<T> extends StatelessWidget {
  const MmMenuButton({
    required this.icon,
    required this.items,
    required this.onSelected,
    this.tooltip,
    super.key,
  });

  final IconData icon;
  final List<MmMenuItem<T>> items;
  final ValueChanged<T> onSelected;
  final String? tooltip;

  @override
  Widget build(BuildContext context) => IconButtonTheme(
    data: IconButtonThemeData(
      style: IconButton.styleFrom(
        minimumSize: const Size(48, 48),
        padding: EdgeInsets.zero,
      ),
    ),
    child: PopupMenuButton<T>(
      icon: Icon(icon),
      tooltip: tooltip,
      onSelected: onSelected,
      itemBuilder: (_) => [
        for (final item in items)
          PopupMenuItem<T>(value: item.value, child: Text(item.label)),
      ],
    ),
  );
}
