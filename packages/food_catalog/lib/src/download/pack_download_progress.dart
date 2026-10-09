import 'pack_download_phase.dart';

/// A snapshot of a download, for a progress bar.
final class PackDownloadProgress {
  const PackDownloadProgress({
    required this.phase,
    required this.receivedBytes,
    required this.totalBytes,
  });

  final PackDownloadPhase phase;
  final int receivedBytes;
  final int totalBytes;

  /// 0 to 1 while downloading.
  double get fraction =>
      totalBytes <= 0 ? 0 : (receivedBytes / totalBytes).clamp(0.0, 1.0);
}
