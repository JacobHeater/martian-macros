import 'package:flutter/material.dart';

import 'mm_nav_destination.dart';

/// The bottom navigation bar: labelled destinations, at most five.
class MmNavigationBar extends StatelessWidget {
  const MmNavigationBar({
    required this.destinations,
    required this.selectedIndex,
    required this.onSelected,
    super.key,
  });

  final List<MmNavDestination> destinations;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) => NavigationBar(
    selectedIndex: selectedIndex,
    onDestinationSelected: onSelected,
    destinations: [
      for (final d in destinations)
        NavigationDestination(
          icon: Icon(d.icon),
          selectedIcon: Icon(d.selectedIcon),
          label: d.label,
        ),
    ],
  );
}
