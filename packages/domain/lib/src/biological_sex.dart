/// Biological sex, used by every sex-dependent formula in the engine.
///
/// Deliberately a closed two-value enum with no "unknown" member: the engine
/// must never fall back to a default. Onboarding cannot complete until the
/// user selects one, and health-platform values outside these two (HealthKit
/// `.other` / `.notSet`; Health Connect has no such field) are ignored.
enum BiologicalSex {
  male,
  female;

  /// Parses a persisted value. Throws on anything else, so a corrupt row can
  /// never silently become a default.
  static BiologicalSex parse(String value) => switch (value) {
    'male' => BiologicalSex.male,
    'female' => BiologicalSex.female,
    _ => throw FormatException('Invalid biological sex: "$value"'),
  };
}
