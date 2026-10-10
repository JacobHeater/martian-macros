import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/under_eating_text.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';

/// One neutral notice when logged days sit far below the calorie floor for
/// two weeks (MM-114). It leads with the innocent explanation and makes its
/// fix one tap. It changes no target and praises nothing.
class UnderEatingNotice extends ConsumerWidget {
  const UnderEatingNotice({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final finding = ref.watch(underEatingNoticeProvider);
    if (finding == null) return const SizedBox.shrink();
    final history =
        ref.watch(setupProvider).value?.screening.eatingDisorderHistory ??
        false;
    final today = ref.watch(todayProvider);
    Future<void> dismiss() => ref
        .read(underEatingNoticeWriterProvider)
        .saveUnderEatingDismissedOn(today);
    return Padding(
      key: const ValueKey('under-eating-notice'),
      padding: const EdgeInsets.only(bottom: 12),
      child: Notice(
        kind: NoticeKind.caution,
        title: 'About your logged days',
        text: underEatingText(finding, supportLine: history),
        action: Wrap(
          spacing: 8,
          children: [
            MmButton(
              key: const ValueKey('under-eating-mark-partial'),
              label: 'Mark those days partial',
              kind: MmButtonKind.secondary,
              onPressed: () async {
                final marks = ref.read(dayMarkWriterProvider);
                for (final day in finding.lowDays) {
                  await marks.setCompleteness(day, DayCompleteness.partial);
                }
              },
            ),
            MmButton(
              key: const ValueKey('under-eating-dismiss'),
              label: 'They are complete',
              kind: MmButtonKind.text,
              onPressed: dismiss,
            ),
          ],
        ),
      ),
    );
  }
}
