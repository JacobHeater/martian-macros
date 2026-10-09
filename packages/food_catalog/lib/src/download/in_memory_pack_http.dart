import 'dart:async';

import 'in_memory_pack_response.dart';
import 'pack_connection_dropped.dart';
import 'pack_http.dart';
import 'pack_response.dart';

/// A [PackHttp] that serves files from memory, for tests and demos: no
/// network. It honours range requests like a real server, and can be told to
/// drop the connection or stall.
final class InMemoryPackHttp implements PackHttp {
  InMemoryPackHttp(this.files, {this.chunkSize = 64 * 1024});

  final Map<Uri, List<int>> files;
  final int chunkSize;

  /// Cut the connection after this many bytes of the next response, as if the
  /// phone lost signal. It applies once.
  int? dropAfterBytes;

  /// Stop sending after this many bytes of the next response but keep the
  /// connection open, until the response is aborted.
  int? stallAfterBytes;

  /// Answer every request with this status instead of the file.
  int? failWithStatus;

  /// Whether the server honours `Range` (a real one does).
  bool supportsRange = true;

  /// Each request made: the URL and the offset asked for.
  final requests = <({Uri url, int? rangeStart})>[];

  @override
  Future<PackResponse> get(Uri url, {int? rangeStart}) async {
    requests.add((url: url, rangeStart: rangeStart));
    if (failWithStatus != null) {
      return InMemoryPackResponse(failWithStatus!, const Stream.empty(), () {});
    }
    final bytes = files[url];
    if (bytes == null) {
      return InMemoryPackResponse(404, const Stream.empty(), () {});
    }
    final start = supportsRange ? (rangeStart ?? 0) : 0;
    final drop = dropAfterBytes;
    final stall = stallAfterBytes;
    dropAfterBytes = null;
    stallAfterBytes = null;
    final controller = StreamController<List<int>>();
    var aborted = false;
    unawaited(() async {
      var sent = start;
      while (sent < bytes.length && !aborted) {
        await Future<void>.delayed(Duration.zero);
        if (aborted) return;
        var end = (sent + chunkSize).clamp(0, bytes.length);
        if (drop != null && end > start + drop) end = start + drop;
        if (stall != null && end > start + stall) end = start + stall;
        if (end > sent) controller.add(bytes.sublist(sent, end));
        sent = end;
        if (drop != null && sent >= start + drop) {
          controller.addError(const PackConnectionDropped());
          await controller.close();
          return;
        }
        if (stall != null && sent >= start + stall) {
          return; // never closes; abort() ends it
        }
      }
      if (!aborted) await controller.close();
    }());
    return InMemoryPackResponse(start > 0 ? 206 : 200, controller.stream, () {
      aborted = true;
      if (!controller.isClosed) unawaited(controller.close());
    });
  }
}
