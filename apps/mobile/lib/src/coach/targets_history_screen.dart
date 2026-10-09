import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_list_row.dart';
import 'show_target_change_sheet.dart';

/// Every set of targets the user has had, newest first. Each opens the reasons
/// it was issued with (MM-138).
class TargetsHistoryScreen extends ConsumerWidget {
  const TargetsHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(targetsHistoryProvider).value ?? const [];
    final today = ref.watch(todayProvider);
    return Scaffold(
      appBar: const MmAppBar(title: 'Target history'),
      body: history.isEmpty
          ? const Center(child: Text('No targets yet.'))
          : ListView(
              children: [
                for (var i = history.length - 1; i >= 0; i--)
                  MmListRow(
                    title: Fmt.day(history[i].effectiveFrom, today),
                    subtitle: [
                      '${Fmt.kcal(history[i].targets.kcal)} · '
                          'P ${_proteinRange(history[i].targets)} · '
                          'C ${history[i].targets.carbsG.round()} · '
                          'F ${history[i].targets.fatG.round()}',
                      if (history[i].targets.flags.contains(
                        TargetFlag.heldByUser,
                      ))
                        'Kept by you',
                    ].join('\n'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => showTargetChangeSheet(
                      context,
                      ref.read(targetsHistoryWriterProvider),
                      history.sublist(0, i + 1),
                      isCurrent: i == history.length - 1,
                    ),
                  ),
              ],
            ),
    );
  }

  String _proteinRange(DailyTargets targets) {
    final minimum = targets.proteinMinimumG;
    return minimum == null
        ? '${targets.proteinG.round()}'
        : '${minimum.round()}–${targets.proteinG.round()}';
  }
}
