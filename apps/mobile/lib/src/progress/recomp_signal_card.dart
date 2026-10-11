import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/fmt.dart';
import '../format/recomp_signal_text.dart';
import '../ui/info_card.dart';
import 'recomp_signal_provider.dart';

/// The recomp signal (MM-32): shown while trend weight is flat, the waist
/// is down and strength is up over four weeks, in any goal, since it says
/// what happened and not what was meant. With one of the three not logged
/// it says what logging it would show. Otherwise it takes no room.
class RecompSignalCard extends ConsumerWidget {
  const RecompSignalCard({required this.fmt, super.key});

  final Fmt fmt;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signal = ref.watch(recompSignalProvider);
    final text = signal == null ? null : recompSignalText(signal, fmt);
    if (signal == null || text == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: InfoCard(
        key: const ValueKey('recomp-signal'),
        title: signal.present ? 'Recomp signal' : 'Close to a recomp signal',
        child: Text(text, key: const ValueKey('recomp-signal-text')),
      ),
    );
  }
}
