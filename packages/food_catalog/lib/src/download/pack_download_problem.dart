/// Why a download did not finish, apart from being cancelled.
enum PackDownloadProblem {
  /// The host answered with an error status.
  serverError,

  /// The connection dropped or the host could not be reached. What arrived is
  /// kept, so the download can resume.
  connection,

  /// The file did not match its checksum and was discarded.
  checksumMismatch,

  /// The file is not a pack this app reads (wrong or newer format).
  unreadablePack,

  /// The device had no room to store it.
  noSpace,
}
