import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/explanation_line_text.dart';
import '../format/fmt.dart';
import '../repository_role_providers.dart';
import '../ui/info_card.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import 'show_target_change_sheet.dart';
import 'targets_history_screen.dart';

/// The most recent change to the user's targets, in one line, and the way to
/// the full account and to the whole history (MM-138).
class LastChangeCard extends ConsumerWidget {
  const LastChangeCard({
    required this.history,
    required this.today,
    this.holdNote,
    super.key,
  });

  final List<TargetsRecord> history;
  final CalendarDate today;

  /// Set when the estimate is held for lack of data after calibration.
  final String? holdNote;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (history.isEmpty) return const SizedBox.shrink();
    final current = history.last;
    final explanation = current.explanation;

    final summary = explanation == null
        ? ExplanationLine(ExplanationReason.noExplanationRecorded, 0).text
        : explanation.previousKcal == null
        ? 'Your first targets.'
        : explanation.lines.isEmpty
        ? 'Calories unchanged at ${Fmt.kcal(explanation.newKcal)}.'
        : 'Calories ${Fmt.whole(explanation.previousKcal!)} → '
              '${Fmt.whole(explanation.newKcal)}. '
              '${_largest(explanation).text}';

    return InfoCard(
      title: 'Last change · ${Fmt.day(current.effectiveFrom, today)}',
      trailing: MmButton(
        label: 'History',
        kind: MmButtonKind.text,
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (_) => const TargetsHistoryScreen()),
        ),
      ),
      onTap: () => showTargetChangeSheet(
        context,
        ref.read(targetsHistoryWriterProvider),
        history,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(summary),
          if (holdNote != null) ...[
            const SizedBox(height: 8),
            Text(holdNote!, style: Theme.of(context).textTheme.bodySmall),
          ],
          const SizedBox(height: 8),
          Text('See why', style: Theme.of(context).textTheme.labelMedium),
        ],
      ),
    );
  }

  ExplanationLine _largest(TargetsExplanation e) =>
      e.lines.reduce((a, b) => a.kcal.abs() >= b.kcal.abs() ? a : b);
}
