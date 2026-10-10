import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../coach/monthly_report_screen.dart';
import '../providers.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';

/// A line when a monthly report has just become ready (MM-33): for a week
/// after it does. No count, no pressure; the reports stay on the Coach screen.
class ReportReadyNotice extends ConsumerWidget {
  const ReportReadyNotice({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final periods = ref.watch(reportPeriodsProvider);
    final today = ref.watch(todayProvider);
    if (periods.isEmpty) return const SizedBox.shrink();
    final latest = periods.last;
    if (latest.readyOn.daysUntil(today) >= 7) return const SizedBox.shrink();
    return Padding(
      key: const ValueKey('report-ready'),
      padding: const EdgeInsets.only(bottom: 12),
      child: Notice(
        icon: Icons.article_outlined,
        title: latest.index == 0
            ? 'Your first month is done'
            : 'A new monthly report is ready',
        text:
            'See what you did, what your body did and what the coach '
            'measured.',
        action: MmButton(
          key: const ValueKey('report-ready-open'),
          label: 'Open the report',
          kind: MmButtonKind.secondary,
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => MonthlyReportScreen(index: latest.index),
            ),
          ),
        ),
      ),
    );
  }
}
