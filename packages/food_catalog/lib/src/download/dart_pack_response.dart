import 'dart:io';

import 'pack_response.dart';

/// A [PackResponse] over a `dart:io` response.
final class DartPackResponse implements PackResponse {
  DartPackResponse(this._request, this._response);

  final HttpClientRequest _request;
  final HttpClientResponse _response;

  @override
  int get statusCode => _response.statusCode;

  @override
  Stream<List<int>> get body => _response;

  @override
  void abort() => _request.abort();
}
