import 'evidence_grade.dart';

/// One constant or rule in the evidence register.
final class EvidenceRow {
  const EvidenceRow({
    required this.name,
    required this.value,
    required this.where,
    required this.decides,
    required this.source,
    required this.grade,
    required this.population,
    required this.checked,
  });

  /// The identifier in code, such as `SafetyBounds.proteinRangeG`.
  final String name;
  final String value;
  final String where;
  final String decides;

  /// The citation as recorded, or the named product judgement.
  final String source;
  final EvidenceGrade grade;

  /// Who the evidence comes from; applying it beyond them is an extrapolation.
  final String population;

  /// Whether someone has read the primary source and confirmed the row.
  final bool checked;
}
