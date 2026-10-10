import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/recovery_question_text.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/info_card.dart';
import '../ui/mini_trend.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import 'recovery_check_in_screen.dart';

/// How the user is holding up (MM-116): the weekly check-in when it is due,
/// and each answer as its own small line over the last eight check-ins. The
/// answers are never combined into one number, and never lower a target.
class RecoveryCard extends ConsumerWidget {
  const RecoveryCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final all = ref.watch(recoveryCheckInsProvider).value ?? const [];
    final due = ref.watch(recoveryCheckInDueProvider);
    final today = ref.watch(todayProvider);
    final text = Theme.of(context).textTheme;
    final shown = all.length > RecoveryRule.shownCheckIns
        ? all.sublist(all.length - RecoveryRule.shownCheckIns)
        : all;
    void answer() => Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const RecoveryCheckInScreen()),
    );
    String series(RecoveryQuestion question) =>
        [for (final c in shown) c.answer(question)].join(', ');

    return InfoCard(
      key: const ValueKey('recovery-card'),
      title: 'How you are holding up',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (shown.isEmpty)
            Text(
              'Five quick questions a week on hunger, energy, sleep, '
              'training and mood. They are what the food log and the scale '
              'cannot see.',
              style: text.bodyMedium,
            ),
          if (shown.isNotEmpty)
            for (final question in RecoveryQuestion.values)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(question.label, style: text.bodyMedium),
                    ),
                    Text(
                      '${shown.last.answer(question)} of '
                      '${RecoveryRule.highest}',
                      style: text.bodyMedium?.copyWith(color: context.mm.text2),
                    ),
                    const SizedBox(width: 12),
                    MiniTrend(
                      values: [
                        for (final c in shown) c.answer(question).toDouble(),
                      ],
                      min: RecoveryRule.lowest.toDouble(),
                      max: RecoveryRule.highest.toDouble(),
                      slots: RecoveryRule.shownCheckIns,
                      semanticsLabel:
                          '${question.label} over the last ${shown.length} '
                          'check-ins: ${series(question)}',
                    ),
                  ],
                ),
              ),
          if (shown.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '1 is the hard end, 5 the easy end. Your answers only ever '
                'lead to an offer of relief, never to a lower target.',
                style: text.bodySmall?.copyWith(color: context.mm.text2),
              ),
            ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              MmButton(
                key: const ValueKey('recovery-answer'),
                label: due
                    ? 'Answer this week'
                    : all.isEmpty
                    ? 'Answer now'
                    : 'Answer again',
                kind: due ? MmButtonKind.secondary : MmButtonKind.text,
                onPressed: answer,
              ),
              if (due)
                MmButton(
                  key: const ValueKey('recovery-skip'),
                  label: 'Skip this week',
                  kind: MmButtonKind.text,
                  onPressed: () => ref
                      .read(recoverySkipWriterProvider)
                      .saveRecoveryCheckInSkippedOn(today),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
