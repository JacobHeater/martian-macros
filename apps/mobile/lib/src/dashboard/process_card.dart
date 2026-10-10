import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/logging_streak_text.dart';
import '../providers.dart';
import '../ui/info_card.dart';

/// A quiet acknowledgement of the work (MM-92): how many whole days have been
/// logged in a row. No confetti, no notification, and nothing about weight or
/// how much was eaten. Empty until there is a streak worth saying.
class ProcessCard extends ConsumerWidget {
  const ProcessCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final line = loggingStreakText(ref.watch(loggingStreakProvider));
    if (line == null) return const SizedBox.shrink();
    return InfoCard(
      key: const ValueKey('process-card'),
      title: 'Your logging',
      child: Text(line, style: Theme.of(context).textTheme.bodyMedium),
    );
  }
}
