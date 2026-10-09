import 'dart:async';
import 'dart:io';

import 'package:crypto/crypto.dart';

import '../sqlite_food_pack.dart';
import 'pack_download_cancelled.dart';
import 'pack_download_failed.dart';
import 'pack_download_phase.dart';
import 'pack_download_problem.dart';
import 'pack_download_progress.dart';
import 'pack_http.dart';
import 'pack_listing.dart';
import 'pack_response.dart';
import 'pack_store.dart';

/// One download of one pack, from the first byte to the swap (MM-56).
///
/// It writes to a partial file, resumes from it when there is one, checks the
/// SHA-256, unpacks, confirms the result opens as a pack this app reads, and
/// only then replaces the installed pack. Until that last step the installed
/// pack is untouched, so a download that fails or is cancelled costs nothing.
///
/// Nothing starts until [PackDownload.start] is called; the app only does so
/// when the user asks.
final class PackDownload {
  PackDownload._(this.listing, this._http, this._store);

  /// Begins downloading [listing] now.
  factory PackDownload.start({
    required PackListing listing,
    required PackHttp http,
    required PackStore store,
  }) => PackDownload._(listing, http, store).._run();

  final PackListing listing;
  final PackHttp _http;
  final PackStore _store;

  final _progress = StreamController<PackDownloadProgress>.broadcast();
  final _done = Completer<void>();
  var _cancelled = false;
  PackResponse? _response;
  StreamSubscription<List<int>>? _subscription;
  Completer<void>? _transfer;

  /// Progress as it happens, until the download ends.
  Stream<PackDownloadProgress> get progress => _progress.stream;

  /// Completes when the pack is installed. Completes with
  /// [PackDownloadFailed] if it could not be, or [PackDownloadCancelled] if
  /// [cancel] was called first.
  Future<void> get done => _done.future;

  /// Stops now. What has been downloaded is kept so a later start resumes.
  void cancel() {
    if (_cancelled || _done.isCompleted) return;
    _cancelled = true;
    unawaited(_subscription?.cancel());
    _response?.abort();
    final transfer = _transfer;
    if (transfer != null && !transfer.isCompleted) {
      transfer.completeError(const PackDownloadCancelled());
    }
  }

  void _emit(PackDownloadPhase phase, int received) {
    if (_progress.isClosed) return;
    _progress.add(
      PackDownloadProgress(
        phase: phase,
        receivedBytes: received,
        totalBytes: listing.downloadBytes,
      ),
    );
  }

  void _checkCancelled() {
    if (_cancelled) throw const PackDownloadCancelled();
  }

  Future<void> _run() async {
    _done.future.ignore();
    try {
      _store.root.createSync(recursive: true);
      await _fetch();
      _checkCancelled();
      await _verify();
      _checkCancelled();
      await _install();
      _done.complete();
    } on PackDownloadCancelled catch (e) {
      _done.completeError(e);
    } on PackDownloadFailed catch (e) {
      _done.completeError(e);
    } on FileSystemException catch (e) {
      _done.completeError(
        PackDownloadFailed(PackDownloadProblem.noSpace, '$e'),
      );
    } on IOException catch (e) {
      _done.completeError(
        PackDownloadFailed(PackDownloadProblem.connection, '$e'),
      );
    } finally {
      await _progress.close();
    }
  }

  Future<void> _fetch() async {
    final part = _store.partialFile(listing.id, listing.version);
    final total = listing.downloadBytes;
    var have = part.existsSync() ? part.lengthSync() : 0;
    if (have > total) {
      part.deleteSync();
      have = 0;
    }
    _emit(PackDownloadPhase.downloading, have);
    if (have == total) return;

    final PackResponse response;
    try {
      response = await _http.get(
        listing.url,
        rangeStart: have > 0 ? have : null,
      );
    } on IOException catch (e) {
      throw PackDownloadFailed(PackDownloadProblem.connection, '$e');
    }
    _response = response;
    if (_cancelled) {
      response.abort();
      throw const PackDownloadCancelled();
    }
    final status = response.statusCode;
    if (status != 200 && status != 206) {
      response.abort();
      throw PackDownloadFailed(PackDownloadProblem.serverError, 'HTTP $status');
    }
    // A server that ignores the range sends the whole file again.
    final append = status == 206 && have > 0;
    if (!append) have = 0;

    final sink = part.openWrite(
      mode: append ? FileMode.append : FileMode.write,
    );
    final transfer = Completer<void>();
    _transfer = transfer;
    _subscription = response.body.listen(
      (chunk) {
        sink.add(chunk);
        have += chunk.length;
        _emit(PackDownloadPhase.downloading, have);
      },
      onError: (Object e) {
        if (!transfer.isCompleted) {
          transfer.completeError(
            PackDownloadFailed(PackDownloadProblem.connection, '$e'),
          );
        }
      },
      onDone: () {
        if (!transfer.isCompleted) transfer.complete();
      },
      cancelOnError: true,
    );
    try {
      await transfer.future;
    } finally {
      await sink.flush();
      await sink.close();
    }
    if (have < total) {
      throw PackDownloadFailed(
        PackDownloadProblem.connection,
        'the connection ended at $have of $total bytes',
      );
    }
  }

  Future<void> _verify() async {
    _emit(PackDownloadPhase.checking, listing.downloadBytes);
    final part = _store.partialFile(listing.id, listing.version);
    final digest = await sha256.bind(part.openRead()).first;
    if (digest.toString() != listing.sha256) {
      part.deleteSync();
      throw const PackDownloadFailed(PackDownloadProblem.checksumMismatch);
    }
  }

  Future<void> _install() async {
    _emit(PackDownloadPhase.installing, listing.downloadBytes);
    final part = _store.partialFile(listing.id, listing.version);
    final staged = _store.stagingFile(listing.id);
    try {
      if (listing.gzip) {
        await part.openRead().transform(gzip.decoder).pipe(staged.openWrite());
      } else {
        await part.copy(staged.path);
      }
    } on FormatException catch (e) {
      _discard(staged, part);
      throw PackDownloadFailed(PackDownloadProblem.unreadablePack, '$e');
    }
    try {
      final pack = SqliteFoodPack.open(staged.path);
      final header = pack.header;
      pack.close();
      if (header.packId != listing.id) {
        throw PackDownloadFailed(
          PackDownloadProblem.unreadablePack,
          'it holds "${header.packId}", not "${listing.id}"',
        );
      }
    } on PackDownloadFailed {
      _discard(staged, part);
      rethrow;
    } on Object catch (e) {
      _discard(staged, part);
      throw PackDownloadFailed(PackDownloadProblem.unreadablePack, '$e');
    }
    _store.commit(listing.id, staged, listing.version);
    if (part.existsSync()) part.deleteSync();
  }

  void _discard(File staged, File part) {
    if (staged.existsSync()) staged.deleteSync();
    if (part.existsSync()) part.deleteSync();
  }
}
