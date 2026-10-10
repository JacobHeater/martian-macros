import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/number_entry_card.dart';

/// The one screen shown on the first opening after a gap (MM-147). It asks
/// for the single thing the coach needs, a weigh-in, and says nothing about
/// the days away: no count, no summary, no streak.
///
/// The end of a pause shows the same screen ([resuming]) without a word that
/// implies absence (MM-148).
class WelcomeBackScreen extends ConsumerWidget {
  const WelcomeBackScreen({this.resuming = false, super.key});

  final bool resuming;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final setup = ref.watch(setupProvider).value;
    final today = ref.watch(todayProvider);
    final text = Theme.of(context).textTheme;
    if (setup == null) return const SizedBox.shrink();
    final fmt = Fmt(setup.unitSystem);
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 48),
            Text(
              resuming ? 'Ready to resume?' : 'Welcome back',
              style: text.headlineMedium,
            ),
            const SizedBox(height: 12),
            Text(
              resuming
                  ? 'A weigh-in gets the coach going again. Your targets are '
                        'what they were, and the next check-in is in a week. '
                        'Expect the scale to move for a few days while water '
                        'settles; that is not fat.'
                  : 'To pick up, the coach needs one thing: a weigh-in.',
              style: text.bodyLarge?.copyWith(color: context.mm.text2),
            ),
            const SizedBox(height: 24),
            NumberEntryCard(
              title: 'Today’s weigh-in',
              unit: fmt.weightUnit,
              fieldKey: 'welcome-back-weigh-in',
              initial: null,
              hint: 'First thing in the morning, after the bathroom.',
              onSave: (value) => ref
                  .read(weightWriterProvider)
                  .saveWeight(today, fmt.weightToKg(value)),
            ),
            const SizedBox(height: 8),
            MmButton(
              key: const ValueKey('welcome-back-later'),
              label: 'Later',
              kind: MmButtonKind.text,
              onPressed: () => ref
                  .read(returnScreenWriterProvider)
                  .saveReturnScreenDismissedOn(today),
            ),
          ],
        ),
      ),
    );
  }
}
