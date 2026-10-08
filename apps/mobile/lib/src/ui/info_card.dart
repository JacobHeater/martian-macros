import 'package:flutter/material.dart';

import 'mm_surface.dart';

/// A titled card section used across the main screens.
class InfoCard extends StatelessWidget {
  const InfoCard({
    required this.title,
    required this.child,
    this.trailing,
    super.key,
  });

  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => MmSurface(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            ?trailing,
          ],
        ),
        const SizedBox(height: 12),
        child,
      ],
    ),
  );
}
