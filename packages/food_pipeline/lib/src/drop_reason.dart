/// Why an entry was read but not written. Every drop has exactly one reason,
/// so the report's counts add up.
enum DropReason {
  missingName,
  missingValue,
  negativeValue,
  macrosExceed100g,
  energyTooHigh,
  energyDisagreesWithMacros,

  /// A barcode that is missing, has the wrong length or fails its check digit.
  invalidBarcode,

  /// An older version of a product the same source lists again.
  supersededVersion,

  /// Lost to another source's record for the same barcode.
  lostConflict,
}
