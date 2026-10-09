import 'pack_response.dart';

/// A [PackResponse] held in memory.
final class InMemoryPackResponse implements PackResponse {
  InMemoryPackResponse(this.statusCode, this.body, this._abort);

  @override
  final int statusCode;
  @override
  final Stream<List<int>> body;
  final void Function() _abort;

  @override
  void abort() => _abort();
}
