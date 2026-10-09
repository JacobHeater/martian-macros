import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../food_packs/food_pack_providers.dart';
import '../food_packs/pack_download_status.dart';
import '../ui/download_status_strip.dart';

/// Shows a strip along the bottom of every screen for as long as a food
/// download is running, with a Cancel button, so a download is never hidden.
class DownloadStatusHost extends ConsumerWidget {
  const DownloadStatusHost({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(packDownloadControllerProvider);
    final running = state.status == PackDownloadStatus.running;
    final progress = state.progress;
    final cancellable =
        progress == null || progress.phase == PackDownloadPhase.downloading;
    final title = state.listing?.title ?? 'food database';
    // The same widgets in the same places whether or not the strip shows, so
    // the navigator underneath is never rebuilt from scratch.
    return Column(
      children: [
        Expanded(
          // While the strip is up it takes the bottom inset.
          child: MediaQuery.removePadding(
            context: context,
            removeBottom: running,
            child: child,
          ),
        ),
        if (running)
          DownloadStatusStrip(
            label: switch (progress?.phase) {
              PackDownloadPhase.checking => 'Checking $title',
              PackDownloadPhase.installing => 'Installing $title',
              _ => 'Downloading $title',
            },
            fraction: progress?.fraction ?? 0,
            onCancel: cancellable
                ? ref.read(packDownloadControllerProvider.notifier).cancel
                : null,
          ),
      ],
    );
  }
}
