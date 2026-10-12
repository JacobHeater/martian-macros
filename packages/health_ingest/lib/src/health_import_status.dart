/// How an import went (MM-67).
enum HealthImportStatus {
  /// The changes since last time were applied.
  updated,

  /// The platform's token had expired, so everything was read again and
  /// what is stored now matches the platform exactly.
  readAgain,

  /// The user has not let the app read this type. Nothing was touched.
  notPermitted,
}
