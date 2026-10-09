/// Where the one food-pack download is.
enum PackDownloadStatus {
  /// Nothing started.
  idle,

  /// Bytes are arriving, or being checked and installed.
  running,

  /// Cancelled; what arrived is kept and the download can resume.
  paused,

  /// Stopped by a problem; the installed pack is untouched.
  failed,

  /// The pack is installed.
  done,
}
