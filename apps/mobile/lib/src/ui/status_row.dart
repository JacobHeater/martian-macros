import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';

/// A one-line state that qualifies the surface above it (calibration, a recent
/// change), with a way into the detail. Replaces a standalone banner.
class StatusRow extends StatelessWidget {
  const StatusRow({
    required this.text,
    required this.onTap,
    this.icon = Icons.info_outline,
    super.key,
  });

  final String text;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 48),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(icon, size: 20, color: context.mm.info),
            const SizedBox(width: 12),
            Expanded(
              child: Text(text, style: Theme.of(context).textTheme.bodySmall),
            ),
            const SizedBox(width: 8),
            Icon(Icons.chevron_right, size: 20, color: context.mm.text3),
          ],
        ),
      ),
    ),
  );
}
