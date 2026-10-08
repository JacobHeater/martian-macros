import 'package:flutter/material.dart';

/// A tappable, selectable card used for single-choice questions.
class ChoiceCard extends StatelessWidget {
  const ChoiceCard({
    required this.label,
    required this.selected,
    required this.onTap,
    this.detail,
    this.badge,
    this.dense = false,
    super.key,
  });

  final String label;
  final String? detail;
  final String? badge;
  final bool selected;
  final bool dense;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: selected ? scheme.primaryContainer : scheme.surfaceContainerLow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: selected ? scheme.primary : scheme.outlineVariant,
            width: selected ? 2 : 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: 16,
              vertical: dense ? 12 : 16,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(child: Text(label, style: text.titleSmall)),
                          if (badge != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: scheme.tertiaryContainer,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                badge!,
                                style: text.labelSmall?.copyWith(
                                  color: scheme.onTertiaryContainer,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (detail != null) ...[
                        const SizedBox(height: 4),
                        Text(detail!, style: text.bodySmall),
                      ],
                    ],
                  ),
                ),
                if (selected) Icon(Icons.check_circle, color: scheme.primary),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
