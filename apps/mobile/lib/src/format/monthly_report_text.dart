import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'explanation_line_text.dart';
import 'fmt.dart';

/// The fixed words of the monthly report (MM-33). Facts and the reasons for
/// them: no grade, no score, and nothing that praises eating less.
final class MonthlyReportText {
  const MonthlyReportText(this.report, this.fmt, this.today);

  final MonthlyReport report;
  final Fmt fmt;
  final CalendarDate today;

  /// "Jan 1 – Jan 28".
  String get title =>
      '${Fmt.shortDay(report.period.from)} – ${Fmt.shortDay(report.period.to)}';

  /// What the user did.
  List<(String, String)> get work => [
    ('Days logged', '${report.daysLogged} of ${ReportPeriod.days}'),
    ('Whole days', '${report.completeDays}'),
    ('Weigh-ins', '${report.weighIns}'),
    if (report.averageProteinG case final protein?)
      (
        'Average protein',
        report.averageProteinTargetG == null
            ? Fmt.grams(protein)
            : '${Fmt.grams(protein)} against a target of '
                  '${Fmt.grams(report.averageProteinTargetG!)}',
      ),
  ];

  /// What the body did, or why that cannot be said.
  List<(String, String)> get body {
    final trend = report.trendChangeKg;
    final intended = report.intendedChangeKg;
    final from = report.waistFromCm;
    final to = report.waistToCm;
    return [
      (
        'Trend weight',
        trend == null
            ? 'Too few weigh-ins to say'
            : '${fmt.weightDelta(trend)}'
                  '${intended == null ? '' : ', against ${fmt.weightDelta(intended)} intended'}',
      ),
      if (from != null && to != null)
        (
          'Waist',
          '${fmt.length(from)} to ${fmt.length(to)} '
              '(${to - from < 0 ? '−' : '+'}'
              '${fmt.lengthFromCm((to - from).abs()).toStringAsFixed(1)} '
              '${fmt.lengthUnit})',
        ),
    ];
  }

  /// The expenditure estimate, or the reason there is none.
  String get estimate {
    final e = report.estimate;
    if (e != null) {
      return '${Fmt.whole(e.kcal)} kcal a day, give or take '
          '${Fmt.whole(e.sigmaKcal)}.';
    }
    return switch (report.estimateGap) {
      ReportEstimateGap.tooFewFoodDays =>
        'Not measured this month: only ${report.completeDays} whole days '
            'were logged, and the coach needs at least $calibrationDays to '
            'tell your expenditure from the scale.',
      ReportEstimateGap.notSettled =>
        'Not measured this month: the coach did not settle on an estimate '
            'from the days that were logged.',
      null => 'Not measured this month.',
    };
  }

  /// One line per change to the targets, with the estimate it rested on.
  List<String> get targetChanges => [
    for (final change in report.targetChanges)
      [
        '${Fmt.shortDay(change.date)}: '
            '${change.previousKcal == null ? 'first targets, ' : '${Fmt.whole(change.previousKcal!)} to '}'
            '${Fmt.kcal(change.newKcal)}.',
        for (final line in change.lines)
          if (line.reason != ExplanationReason.noExplanationRecorded) line.text,
        'Based on an expenditure estimate of ${Fmt.whole(change.tdeeKcal)} '
            'kcal a day, give or take ${Fmt.whole(change.tdeeSigmaKcal)}'
            '${change.tdeeStatus == TdeeStatus.updated ? '' : ' (still the starting estimate)'}.',
      ].join(' '),
  ];
}
