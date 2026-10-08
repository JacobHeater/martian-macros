import 'package:flutter/material.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/explanation_line_text.dart';
import '../format/fmt.dart';
import '../format/what_would_change_it.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/section_label.dart';

/// Why a set of targets was issued, in four parts: what changed, why (lines
/// that add up), what it was based on, and what would change it (MM-138).
class TargetChangeSheet extends StatelessWidget {
  const TargetChangeSheet({
    required this.current,
    required this.previous,
    this.onHold,
    super.key,
  });

  final TargetsRecord current;
  final TargetsRecord? previous;

  /// Set when the user may keep last week's targets for now (a single
  /// deferral of an ordinary reduction).
  final VoidCallback? onHold;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final explanation = current.explanation;
    final t = current.targets;
    final p = previous?.targets;

    String change(String label, double? before, double after, String unit) {
      if (before == null) return '$label ${Fmt.whole(after)}$unit';
      return before.round() == after.round()
          ? '$label unchanged'
          : '$label ${Fmt.whole(before)} → ${Fmt.whole(after)}$unit';
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Why your targets are what they are', style: text.titleLarge),
          const SizedBox(height: 16),
          const SectionLabel('What changed'),
          Text(
            [
              change('Calories', p?.kcal, t.kcal, ''),
              change('Protein', p?.proteinG, t.proteinG, ' g'),
              change('Carbohydrate', p?.carbsG, t.carbsG, ' g'),
              change('Fat', p?.fatG, t.fatG, ' g'),
            ].join('. '),
            style: text.bodyMedium,
          ),
          const SizedBox(height: 16),
          const SectionLabel('Why'),
          if (explanation == null)
            Text(
              ExplanationLine(ExplanationReason.noExplanationRecorded, 0).text,
              style: text.bodyMedium,
            )
          else if (explanation.lines.isEmpty)
            Text('Nothing moved the calorie target.', style: text.bodyMedium)
          else
            for (final line in explanation.lines)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(line.text, style: text.bodyMedium),
              ),
          if (explanation != null) ...[
            const SizedBox(height: 8),
            const SectionLabel('What it was based on'),
            Text(
              '${explanation.usableIntakeDays} days of food'
              '${explanation.excludedPartialDays > 0 ? ', ${explanation.excludedPartialDays} left out as partial' : ''}'
              ' and ${explanation.weighIns} weigh-ins. '
              '${explanation.estimateStatus == TdeeStatus.updated ? 'Your expenditure is measured.' : 'Your expenditure is still the starting estimate.'}',
              style: text.bodyMedium,
            ),
            const SizedBox(height: 16),
            const SectionLabel('What would change it'),
            Text(
              whatWouldChangeIt(explanation),
              style: text.bodyMedium?.copyWith(color: context.mm.text2),
            ),
          ],
          if (onHold != null) ...[
            const SizedBox(height: 24),
            MmButton(
              label: 'Keep last week’s targets for now',
              kind: MmButtonKind.secondary,
              onPressed: () {
                Navigator.of(context).pop();
                onHold!();
              },
            ),
            const SizedBox(height: 8),
            Text(
              'Targets stay as they are this week, and the change can come at '
              'the next check-in. You can do this once; not twice running.',
              style: text.bodySmall,
            ),
          ],
        ],
      ),
    );
  }
}
