import 'pack_response.dart';

/// The one thing the pack download needs from the network: fetch a file,
/// optionally from a byte offset. A fake stands in for it in tests.
abstract interface class PackHttp {
  Future<PackResponse> get(Uri url, {int? rangeStart});
}
