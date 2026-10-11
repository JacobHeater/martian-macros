import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../ui/info_card.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_list_row.dart';
import 'strength_history_screen.dart';
import 'strength_section.dart';
import 'strength_trends_provider.dart';

class StrengthLiftsScreen extends ConsumerWidget {
  const StrengthLiftsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(strengthTrendsProvider);
    return Scaffold(
      appBar: const MmAppBar(title: 'Lift histories'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (!state.hasValue || state.hasError)
            const StrengthSection()
          else
            InfoCard(
              title: 'Every logged lift',
              child: Column(
                children: [
                  if (state.requireValue.isEmpty)
                    const Text('No finished workouts yet.'),
                  for (final trend in state.requireValue)
                    MmListRow(
                      title: trend.name,
                      subtitle:
                          '${trend.loggedSessions} logged sessions · '
                          '${trend.points.length} qualifying',
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => StrengthHistoryScreen(
                            exerciseId: trend.exerciseId,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
