import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../format/megabytes.dart';
import '../format/pack_download_problem_text.dart';
import '../theme/mm_colors_context.dart';
import '../ui/info_card.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_progress_bar.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import 'food_pack_providers.dart';
import 'pack_download_status.dart';

/// The download as it is now: how far along, a Cancel button while it can be
/// stopped, and what to do after it stops. Shows nothing when there is no
/// download to talk about.
class PackDownloadCard extends ConsumerWidget {
  const PackDownloadCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(packDownloadControllerProvider);
    final controller = ref.read(packDownloadControllerProvider.notifier);
    final listing = state.listing;
    if (listing == null || state.status == PackDownloadStatus.idle) {
      return const SizedBox.shrink();
    }
    final total = listing.downloadBytes;
    final style = Theme.of(context).textTheme;
    final muted = style.bodyMedium?.copyWith(color: context.mm.text2);

    switch (state.status) {
      case PackDownloadStatus.running:
        final progress = state.progress;
        final phase = progress?.phase ?? PackDownloadPhase.downloading;
        return InfoCard(
          title: switch (phase) {
            PackDownloadPhase.downloading => 'Downloading',
            PackDownloadPhase.checking => 'Checking the download',
            PackDownloadPhase.installing => 'Installing',
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(listing.title, style: style.bodyLarge),
              const SizedBox(height: 12),
              MmProgressBar(value: progress?.fraction ?? 0),
              const SizedBox(height: 8),
              Text(
                '${megabytes(progress?.receivedBytes ?? 0)} of '
                '${megabytes(total)}',
                style: muted,
              ),
              if (phase == PackDownloadPhase.downloading) ...[
                const SizedBox(height: 8),
                MmButton(
                  label: 'Cancel',
                  kind: MmButtonKind.secondary,
                  onPressed: controller.cancel,
                ),
              ],
            ],
          ),
        );
      case PackDownloadStatus.paused:
        return InfoCard(
          title: 'Paused',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(listing.title, style: style.bodyLarge),
              const SizedBox(height: 8),
              Text(
                '${megabytes(state.keptBytes)} of ${megabytes(total)} is kept '
                'on your phone. Resume to get the rest, or discard it.',
                style: muted,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  MmButton(
                    label: 'Resume',
                    onPressed: () => controller.start(listing),
                  ),
                  const SizedBox(width: 8),
                  MmButton(
                    label: 'Discard',
                    kind: MmButtonKind.text,
                    onPressed: controller.discard,
                  ),
                ],
              ),
            ],
          ),
        );
      case PackDownloadStatus.failed:
        final problem = state.problem ?? PackDownloadProblem.connection;
        final canResume = state.keptBytes > 0;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Notice(
              kind: NoticeKind.caution,
              text: packDownloadProblemText(problem),
            ),
            const SizedBox(height: 12),
            MmButton(
              label: canResume ? 'Resume' : 'Try again',
              onPressed: () => controller.start(listing),
            ),
            const SizedBox(height: 12),
          ],
        );
      case PackDownloadStatus.done:
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Notice(text: '${listing.title} is on your phone.'),
        );
      case PackDownloadStatus.idle:
        return const SizedBox.shrink();
    }
  }
}
