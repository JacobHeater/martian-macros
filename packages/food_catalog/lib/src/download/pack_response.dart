/// The answer to a pack request: a status and the body as it arrives.
abstract interface class PackResponse {
  /// 200, or 206 when the server honoured a range request.
  int get statusCode;
  Stream<List<int>> get body;

  /// Stops the transfer now.
  void abort();
}
