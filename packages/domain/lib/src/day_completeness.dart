/// Whether a logged day represents everything the user ate.
enum DayCompleteness {
  /// User confirmed the day is fully logged.
  complete,

  /// User marked the day as partially logged; its intake is never used.
  partial,

  /// Not marked; the engine classifies it heuristically.
  unmarked,
}
