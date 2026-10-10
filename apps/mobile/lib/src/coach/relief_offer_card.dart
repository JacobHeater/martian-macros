import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/pace_label.dart';
import '../format/relief_offer_text.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';

/// The offer to ease a deficit when recovery is failing (MM-117): a
/// maintenance week now, a slower pace from the next check-in, or carry on.
/// Never an automatic change. Carrying on is one tap and free of comment.
/// Empty when no offer is due.
class ReliefOfferCard extends ConsumerWidget {
  const ReliefOfferCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offer = ref.watch(reliefOfferProvider);
    final setup = ref.watch(setupProvider).value;
    if (offer == null || setup == null) return const SizedBox.shrink();
    final today = ref.watch(todayProvider);
    final words = reliefOfferText(offer);
    final writer = ref.read(setupWriterProvider);
    final slower = offer.slowerPace;
    final suggestsBreak = offer.suggestion == ReliefChoice.maintenanceWeek;

    return Padding(
      key: const ValueKey('relief-offer'),
      padding: const EdgeInsets.only(bottom: 12),
      child: Notice(
        icon: Icons.spa_outlined,
        title: words.title,
        text: [words.body, words.suggestion, ?words.sleep].join('\n\n'),
        action: Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            MmButton(
              key: const ValueKey('relief-maintenance-week'),
              label: 'Take a maintenance week',
              kind: suggestsBreak
                  ? MmButtonKind.primary
                  : MmButtonKind.secondary,
              onPressed: () => writer.saveSetup(
                setup.copyWith(
                  maintenanceWeekFrom: today,
                  reliefAnsweredOn: today,
                ),
              ),
            ),
            if (slower != null)
              MmButton(
                key: const ValueKey('relief-slower-pace'),
                label: 'Slow to ${paceLabel(slower)}',
                kind: suggestsBreak
                    ? MmButtonKind.secondary
                    : MmButtonKind.primary,
                onPressed: () => writer.saveSetup(
                  setup.copyWith(
                    requestedLossFraction: () => slower,
                    reliefAnsweredOn: today,
                  ),
                ),
              ),
            MmButton(
              key: const ValueKey('relief-carry-on'),
              label: 'Carry on',
              kind: MmButtonKind.text,
              onPressed: () =>
                  writer.saveSetup(setup.copyWith(reliefAnsweredOn: today)),
            ),
          ],
        ),
      ),
    );
  }
}
