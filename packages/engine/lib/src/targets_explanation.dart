import 'dart:convert';

import 'explanation_line.dart';
import 'tdee_status.dart';

/// Why a set of targets was issued: the contributions to the change in
/// calories, which add up to it, and what the estimate rested on (MM-138).
final class TargetsExplanation {
  const TargetsExplanation({
    required this.lines,
    required this.newKcal,
    required this.estimateStatus,
    this.previousKcal,
    this.usableIntakeDays = 0,
    this.excludedPartialDays = 0,
    this.weighIns = 0,
  });

  factory TargetsExplanation.decode(String source) {
    final json = jsonDecode(source) as Map<String, Object?>;
    return TargetsExplanation(
      lines: [
        for (final l in json['lines']! as List<Object?>)
          ExplanationLine.fromJson(l! as Map<String, Object?>),
      ],
      newKcal: (json['newKcal']! as num).toDouble(),
      previousKcal: (json['previousKcal'] as num?)?.toDouble(),
      estimateStatus: TdeeStatus.values.byName(
        json['estimateStatus']! as String,
      ),
      usableIntakeDays: (json['usableIntakeDays'] as num?)?.toInt() ?? 0,
      excludedPartialDays: (json['excludedPartialDays'] as num?)?.toInt() ?? 0,
      weighIns: (json['weighIns'] as num?)?.toInt() ?? 0,
    );
  }

  /// The contributions, in the order they are told: expenditure, the rest of
  /// the calculation, then the limits.
  final List<ExplanationLine> lines;

  final double newKcal;

  /// Null for the first targets.
  final double? previousKcal;
  final TdeeStatus estimateStatus;

  /// Days of food the estimate used, days left out as partial, and weigh-ins.
  final int usableIntakeDays;
  final int excludedPartialDays;
  final int weighIns;

  /// The change in calories, or null for the first targets.
  double? get change => previousKcal == null ? null : newKcal - previousKcal!;

  /// What the lines add up to. Equals [change] (the first targets have none).
  double get linesTotal => lines.fold(0, (sum, l) => sum + l.kcal);

  String encode() => jsonEncode({
    'lines': [for (final l in lines) l.toJson()],
    'newKcal': newKcal,
    if (previousKcal != null) 'previousKcal': previousKcal,
    'estimateStatus': estimateStatus.name,
    'usableIntakeDays': usableIntakeDays,
    'excludedPartialDays': excludedPartialDays,
    'weighIns': weighIns,
  });
}
