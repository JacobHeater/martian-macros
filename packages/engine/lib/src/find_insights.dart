import 'package:mm_domain/mm_domain.dart';

import 'insight.dart';
import 'insight_rationing.dart';
import 'insight_rule.dart';
import 'stall_assessment.dart';
import 'stall_status.dart';
import 'targets_record.dart';
import 'usable_intake_days.dart';

/// Every insight the catalog's rules produce from the data up to [through],
/// highest priority first (MM-141). Rationing is applied afterwards by
/// `selectInsight`.
///
/// Each rule is a pattern over [InsightRationing.patternDays] days resting on
/// at least [InsightRationing.minimumBasisDays] days of data, so nothing here
/// can be about a single day or a single weigh-in. For a user with an
/// eating-disorder history ([limitToProteinAndLogging]) rules about weight
/// are left out entirely.
List<Insight> findInsights({
  required CalendarDate through,
  required List<IntakeDay> intake,
  required List<WeightObservation> weights,
  required List<TargetsRecord> history,
  StallAssessment? stall,
  bool limitToProteinAndLogging = false,
}) {
  const days = InsightRationing.patternDays;
  const minimum = InsightRationing.minimumBasisDays;
  final from = through.addDays(1 - days);
  bool inPeriod(CalendarDate d) => !d.isBefore(from) && !d.isAfter(through);

  final logged = [
    for (final d in intake)
      if (inPeriod(d.date) && d.kcal > 0) d,
  ];
  final whole = usableIntakeDays(logged);
  final found = <Insight>[];
  void add(InsightRule rule, Map<String, double> figures) =>
      found.add(Insight(rule: rule, from: from, to: through, figures: figures));

  // More than a third of logged days are partial (MM-27).
  final partial = logged.length - whole.length;
  if (logged.length >= minimum && partial * 3 > logged.length) {
    add(InsightRule.partialDays, {
      'loggedDays': logged.length.toDouble(),
      'partialDays': partial.toDouble(),
    });
  }

  // More than half the calories on whole days were estimated (MM-150).
  if (whole.length >= minimum) {
    final kcal = whole.fold(0.0, (s, d) => s + d.kcal);
    final estimated = whole.fold(0.0, (s, d) => s + d.kcal * d.estimatedShare);
    if (kcal > 0 && estimated / kcal > 0.5) {
      add(InsightRule.estimatesRising, {
        'wholeDays': whole.length.toDouble(),
        'estimatedShare': estimated / kcal,
      });
    }
  }

  // Fewer than four weigh-ins a week, for someone who does weigh in.
  final weighIns = weights.where((w) => inPeriod(w.date)).length;
  final everWeighedBefore = weights.any((w) => w.date.isBefore(from));
  if (everWeighedBefore && weighIns < 4 * days ~/ 7) {
    add(InsightRule.weighInTiming, {'weighIns': weighIns.toDouble()});
  }

  if (stall != null && stall.status == StallStatus.stalled) {
    found.add(
      Insight(
        rule: InsightRule.stall,
        from: through.addDays(1 - stall.windowDays),
        to: through,
        stall: stall,
      ),
    );
  }

  // The protein minimum was met on fewer than half of whole days (MM-121).
  final sorted = [...history]
    ..sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  double? minimumOn(CalendarDate day) {
    double? value;
    for (final r in sorted) {
      if (r.effectiveFrom.isAfter(day)) break;
      value = r.targets.proteinMinimumG;
    }
    return value;
  }

  var judged = 0, met = 0;
  var shortfall = 0.0;
  for (final d in whole) {
    final min = minimumOn(d.date);
    if (min == null) continue;
    judged++;
    if (d.proteinG >= min) {
      met++;
    } else {
      shortfall += min - d.proteinG;
    }
  }
  if (judged >= minimum && met * 2 < judged) {
    add(InsightRule.proteinShort, {
      'wholeDays': judged.toDouble(),
      'metDays': met.toDouble(),
      'averageShortfallG': shortfall / (judged - met),
    });
  }

  final allowed = [
    for (final i in found)
      if (!(limitToProteinAndLogging && i.rule.aboutWeight)) i,
  ];
  // A stable sort by priority keeps the catalog order within a priority.
  final byPriority =
      [for (final (index, insight) in allowed.indexed) (index, insight)]..sort((
        a,
        b,
      ) {
        final p = a.$2.rule.priority.index.compareTo(b.$2.rule.priority.index);
        return p != 0 ? p : a.$1.compareTo(b.$1);
      });
  return [for (final (_, insight) in byPriority) insight];
}
