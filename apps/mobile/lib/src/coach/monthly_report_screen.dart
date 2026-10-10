import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/fmt.dart';
import '../format/monthly_report_text.dart';
import '../providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/info_card.dart';
import '../ui/mm_app_bar.dart';
import '../ui/stat_row.dart';

/// One monthly report (MM-33): what the user did, what the body did, what
/// the coach measured and every change to the targets with its reason.
class MonthlyReportScreen extends ConsumerWidget {
  const MonthlyReportScreen({required this.index, super.key});

  /// Which report; zero is the first 28 days.
  final int index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final report = ref.watch(monthlyReportProvider(index));
    final setup = ref.watch(setupProvider).value;
    final text = Theme.of(context).textTheme;
    if (report == null || setup == null) {
      return const Scaffold(
        appBar: MmAppBar(title: 'Monthly report'),
        body: Center(child: Text('This report is not ready yet.')),
      );
    }
    final words = MonthlyReportText(
      report,
      Fmt(setup.unitSystem),
      ref.watch(todayProvider),
    );
    return Scaffold(
      appBar: MmAppBar(title: words.title),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          InfoCard(
            key: const ValueKey('report-work'),
            title: 'What you did',
            child: Column(
              children: [for (final (a, b) in words.work) StatRow(a, b)],
            ),
          ),
          InfoCard(
            key: const ValueKey('report-body'),
            title: 'What your body did',
            child: Column(
              children: [for (final (a, b) in words.body) StatRow(a, b)],
            ),
          ),
          InfoCard(
            key: const ValueKey('report-estimate'),
            title: 'What the coach measured',
            child: Text(words.estimate, style: text.bodyMedium),
          ),
          InfoCard(
            key: const ValueKey('report-targets'),
            title: 'Changes to your targets',
            child: words.targetChanges.isEmpty
                ? Text(
                    'Your targets did not change this month.',
                    style: text.bodyMedium?.copyWith(color: context.mm.text2),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (final line in words.targetChanges)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(line, style: text.bodyMedium),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
