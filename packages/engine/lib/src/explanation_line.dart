import 'explanation_reason.dart';

/// One signed contribution to a change in the calorie target.
final class ExplanationLine {
  const ExplanationLine(this.reason, this.kcal, {this.from, this.to});

  factory ExplanationLine.fromJson(Map<String, Object?> json) =>
      ExplanationLine(
        ExplanationReason.values.byName(json['reason']! as String),
        (json['kcal']! as num).toDouble(),
        from: (json['from'] as num?)?.toDouble(),
        to: (json['to'] as num?)?.toDouble(),
      );

  final ExplanationReason reason;

  /// How much this cause moved the calorie target, signed.
  final double kcal;

  /// What the cause moved from and to, when that helps to say it: the
  /// expenditure before and after, or the target the floor held up.
  final double? from;
  final double? to;

  Map<String, Object?> toJson() => {
    'reason': reason.name,
    'kcal': kcal,
    if (from != null) 'from': from,
    if (to != null) 'to': to,
  };
}
