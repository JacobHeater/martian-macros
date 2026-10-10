import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../format/insight_text.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/info_card.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_disclosure.dart';
import '../ui/stat_row.dart';
import 'insight_card.dart';

class InsightCardState extends ConsumerState<InsightCard> {
  InsightRule? _recorded;

  /// A new insight is written to the log once, so the rationing counts it.
  void _recordShown(InsightSelection selection) {
    if (!selection.isNew || _recorded == selection.insight.rule) return;
    _recorded = selection.insight.rule;
    final today = ref.read(todayProvider);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref
            .read(insightLogWriterProvider)
            .recordInsightShown(selection.insight.rule, today);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final selection = ref.watch(insightSelectionProvider);
    final setup = ref.watch(setupProvider).value;
    if (selection == null || setup == null) return const SizedBox.shrink();
    _recordShown(selection);
    final insight = selection.insight;
    final (title, body, evidence) = insightText(insight, Fmt(setup.unitSystem));
    return InfoCard(
      key: ValueKey('insight-${insight.rule.name}'),
      title: title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(body, style: Theme.of(context).textTheme.bodyMedium),
          MmDisclosure(
            title: 'What this rests on',
            children: [
              for (final (label, value) in evidence) StatRow(label, value),
            ],
          ),
          Align(
            // On the left, clear of the Add food button.
            alignment: Alignment.centerLeft,
            child: MmButton(
              key: const ValueKey('insight-dismiss'),
              label: 'Dismiss',
              kind: MmButtonKind.text,
              onPressed: () => ref
                  .read(insightLogWriterProvider)
                  .dismissInsight(insight.rule, ref.read(todayProvider)),
            ),
          ),
        ],
      ),
    );
  }
}
