import 'package:flutter/material.dart';

import 'mm_menu_item.dart';

/// An icon that opens a short menu of choices.
class MmMenuButton<T> extends StatelessWidget {
  const MmMenuButton({
    required this.icon,
    required this.items,
    required this.onSelected,
    super.key,
  });

  final IconData icon;
  final List<MmMenuItem<T>> items;
  final ValueChanged<T> onSelected;

  @override
  Widget build(BuildContext context) => PopupMenuButton<T>(
    icon: Icon(icon),
    onSelected: onSelected,
    itemBuilder: (_) => [
      for (final item in items)
        PopupMenuItem<T>(value: item.value, child: Text(item.label)),
    ],
  );
}
