/// How good the evidence behind a constant or rule is (docs/evidence.md).
enum EvidenceGrade {
  /// Consistent meta-analyses, consensus statements, or established physiology.
  strong('Well established'),

  /// A good meta-analysis with inconsistency, several trials, or strong
  /// evidence in a population different from the app's users.
  moderate('Reasonably supported'),

  /// One or a few small studies.
  emerging('Early evidence'),

  /// Expert practice or product reasoning with no direct trial.
  judgement('Our judgement');

  const EvidenceGrade(this.inWords);

  /// What the app says, in place of the grade's name.
  final String inWords;

  static EvidenceGrade parse(String name) => values.firstWhere(
    (g) => g.name == name,
    orElse: () => throw FormatException('Not an evidence grade: "$name"'),
  );
}
