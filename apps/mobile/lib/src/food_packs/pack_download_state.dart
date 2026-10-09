import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'pack_download_status.dart';

/// What the app knows about the current food-pack download.
final class PackDownloadState {
  const PackDownloadState({
    this.status = PackDownloadStatus.idle,
    this.listing,
    this.progress,
    this.problem,
    this.keptBytes = 0,
  });

  final PackDownloadStatus status;
  final PackListing? listing;
  final PackDownloadProgress? progress;
  final PackDownloadProblem? problem;

  /// Bytes kept on the phone from a cancelled or interrupted download.
  final int keptBytes;

  bool get isRunning => status == PackDownloadStatus.running;

  /// Bytes received so far while running, else the bytes kept.
  int get receivedBytes => progress?.receivedBytes ?? keptBytes;
}
