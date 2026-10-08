import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';

/// Where the user is in a fixed sequence of steps: one segment per step, the
/// done and current ones filled. Steps, not a percentage.
class StepProgress extends StatelessWidget {
  const StepProgress({required this.current, required this.count, super.key});

  /// Zero-based index of the current step.
  final int current;
  final int count;

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Step ${current + 1} of $count',
    child: ExcludeSemantics(
      child: Row(
        children: [
          for (var i = 0; i < count; i++) ...[
            if (i > 0) const SizedBox(width: 6),
            Expanded(
              child: Container(
                height: 4,
                decoration: BoxDecoration(
                  color: i <= current ? context.mm.energy : context.mm.track,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ],
        ],
      ),
    ),
  );
}
