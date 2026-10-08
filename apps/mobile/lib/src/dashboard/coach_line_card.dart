import 'package:flutter/material.dart';

import '../ui/mm_surface.dart';

/// One line on what the coach is doing. Opens the Coach screen.
class CoachLineCard extends StatelessWidget {
  const CoachLineCard({required this.text, required this.onTap, super.key});

  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => MmSurface(
    onTap: onTap,
    child: Row(
      children: [
        const Icon(Icons.insights_outlined),
        const SizedBox(width: 12),
        Expanded(child: Text(text)),
        const Icon(Icons.chevron_right),
      ],
    ),
  );
}
