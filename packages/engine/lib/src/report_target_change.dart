import 'package:mm_domain/mm_domain.dart';

import 'explanation_line.dart';
import 'tdee_status.dart';

/// A change in targets made during the month, with the estimate it was based
/// on (MM-33).
final class ReportTargetChange {
  const ReportTargetChange({
    required this.date,
    required this.newKcal,
    required this.tdeeKcal,
    required this.tdeeSigmaKcal,
    required this.tdeeStatus,
    required this.lines,
    this.previousKcal,
  });

  final CalendarDate date;

  /// Null for the very first targets.
  final double? previousKcal;
  final double newKcal;

  /// The expenditure estimate the targets were made from.
  final double tdeeKcal;
  final double tdeeSigmaKcal;
  final TdeeStatus tdeeStatus;

  /// Why, as the contributions recorded when they were issued (MM-138).
  final List<ExplanationLine> lines;
}
