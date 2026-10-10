import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../ui/info_card.dart';
import '../ui/mm_list_row.dart';
import 'monthly_report_screen.dart';

/// Every monthly report that is ready, newest first, each reopenable
/// (MM-33). Empty until the first 28 days are over.
class ReportsCard extends ConsumerWidget {
  const ReportsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final periods = ref.watch(reportPeriodsProvider);
    if (periods.isEmpty) return const SizedBox.shrink();
    return InfoCard(
      key: const ValueKey('reports-card'),
      title: 'Monthly reports',
      child: Column(
        children: [
          for (final period in periods.reversed)
            MmListRow(
              key: ValueKey('report-${period.index}'),
              dense: true,
              title:
                  '${Fmt.shortDay(period.from)} – ${Fmt.shortDay(period.to)}',
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => MonthlyReportScreen(index: period.index),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
