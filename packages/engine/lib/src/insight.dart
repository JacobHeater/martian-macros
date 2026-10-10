import 'package:mm_domain/mm_domain.dart';

import 'insight_rule.dart';
import 'stall_assessment.dart';

/// One thing the coach noticed in the user's own data (MM-141): the rule that
/// produced it, the period it rests on and the figures observed. The words
/// are fixed templates filled from [figures]; nothing is generated.
final class Insight {
  const Insight({
    required this.rule,
    required this.from,
    required this.to,
    this.figures = const {},
    this.stall,
  });

  final InsightRule rule;

  /// The period it was computed from. Never a single day: the minimum basis
  /// is seven days.
  final CalendarDate from;
  final CalendarDate to;

  /// The observed numbers, by name, shown as the evidence.
  final Map<String, double> figures;

  /// The diagnosis, for [InsightRule.stall].
  final StallAssessment? stall;

  int get basisDays => from.daysUntil(to) + 1;
}
