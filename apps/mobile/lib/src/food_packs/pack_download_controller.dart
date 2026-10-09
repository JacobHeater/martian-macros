import 'dart:async';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'food_pack_providers.dart';
import 'pack_download_state.dart';
import 'pack_download_status.dart';

/// Runs the one food-pack download, and only when asked: nothing here starts
/// by itself.
class PackDownloadController extends Notifier<PackDownloadState> {
  PackDownload? _download;
  StreamSubscription<PackDownloadProgress>? _subscription;

  @override
  PackDownloadState build() {
    ref.onDispose(() {
      _download?.cancel();
      unawaited(_subscription?.cancel());
    });
    return const PackDownloadState();
  }

  /// Starts (or resumes) downloading [listing].
  Future<void> start(PackListing listing) async {
    if (state.isRunning) return;
    final store = await ref.read(packStoreProvider.future);
    final kept = store.partialBytes(listing.id, listing.version);
    final download = PackDownload.start(
      listing: listing,
      http: ref.read(packHttpProvider),
      store: store,
    );
    _download = download;
    state = PackDownloadState(
      status: PackDownloadStatus.running,
      listing: listing,
      keptBytes: kept,
      progress: PackDownloadProgress(
        phase: PackDownloadPhase.downloading,
        receivedBytes: kept,
        totalBytes: listing.downloadBytes,
      ),
    );
    _subscription = download.progress.listen((progress) {
      if (identical(_download, download)) {
        state = PackDownloadState(
          status: PackDownloadStatus.running,
          listing: listing,
          progress: progress,
          keptBytes: kept,
        );
      }
    });
    try {
      await download.done;
      state = PackDownloadState(
        status: PackDownloadStatus.done,
        listing: listing,
      );
      ref.invalidate(installedPacksProvider);
    } on PackDownloadCancelled {
      state = PackDownloadState(
        status: PackDownloadStatus.paused,
        listing: listing,
        keptBytes: store.partialBytes(listing.id, listing.version),
      );
    } on PackDownloadFailed catch (e) {
      state = PackDownloadState(
        status: PackDownloadStatus.failed,
        listing: listing,
        problem: e.problem,
        keptBytes: store.partialBytes(listing.id, listing.version),
      );
    } on IOException {
      state = PackDownloadState(
        status: PackDownloadStatus.failed,
        listing: listing,
        problem: PackDownloadProblem.connection,
      );
    }
  }

  /// Stops now, keeping what arrived.
  void cancel() => _download?.cancel();

  /// Throws away an unfinished download.
  Future<void> discard() async {
    final listing = state.listing;
    if (listing == null || state.isRunning) return;
    final store = await ref.read(packStoreProvider.future);
    store.discardPartial(listing.id, listing.version);
    state = const PackDownloadState();
  }
}
