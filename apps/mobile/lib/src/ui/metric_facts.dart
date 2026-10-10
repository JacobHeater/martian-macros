import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';

/// Compact, wrapping facts with labels rather than color-only meaning.
class MetricFacts extends StatelessWidget {
  const MetricFacts({super.key, required this.facts});

  final Map<String, String> facts;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) => Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        for (final entry in facts.entries)
          SizedBox(
            width: (constraints.maxWidth - 12) / 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.value,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Text(
                  entry.key,
                  style: Theme.of(context).textTheme.labelMedium
                      ?.copyWith(color: context.mm.text2),
                ),
              ],
            ),
          ),
      ],
    ),
  );
}
