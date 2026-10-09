import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'mm_surface.dart';

/// Rows that belong together, on one surface with hairlines between them.
class MmListGroup extends StatelessWidget {
  const MmListGroup({required this.children, super.key});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    child: MmSurface(
      padded: false,
      clip: true,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) Divider(height: 1, color: context.mm.outline),
            children[i],
          ],
        ],
      ),
    ),
  );
}
