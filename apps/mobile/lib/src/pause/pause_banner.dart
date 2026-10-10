import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';
import 'pause_screen.dart';

/// Says that coaching is paused, until when, and what that means (MM-148).
/// Empty when no pause covers today.
class PauseBanner extends ConsumerWidget {
  const PauseBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pause = ref.watch(activePauseProvider);
    if (pause == null) return const SizedBox.shrink();
    final guide = ref.watch(maintenanceGuideProvider);
    return Padding(
      key: const ValueKey('pause-banner'),
      padding: const EdgeInsets.only(bottom: 12),
      child: Notice(
        icon: Icons.pause_circle_outline,
        title: 'Paused until ${Fmt.shortDay(pause.to)}',
        text:
            'Targets are on hold and no check-in runs. '
            '${guide == null ? '' : 'As a guide, maintenance is about '
                      '${Fmt.whole(guide.kcal)} kcal a day. '}'
            'Log or weigh in if you like; nothing is counted against you.',
        action: MmButton(
          key: const ValueKey('pause-banner-manage'),
          label: 'Manage pause',
          kind: MmButtonKind.secondary,
          onPressed: () => Navigator.of(
            context,
          ).push(MaterialPageRoute<void>(builder: (_) => const PauseScreen())),
        ),
      ),
    );
  }
}
