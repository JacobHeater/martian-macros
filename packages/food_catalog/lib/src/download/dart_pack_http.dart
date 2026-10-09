import 'dart:io';

import 'dart_pack_response.dart';
import 'pack_http.dart';
import 'pack_response.dart';

/// [PackHttp] over `dart:io`. Sends no cookies, no identifiers and no body:
/// the host learns an IP address and which file was asked for.
final class DartPackHttp implements PackHttp {
  DartPackHttp({HttpClient? client}) : _client = client ?? HttpClient();

  final HttpClient _client;

  @override
  Future<PackResponse> get(Uri url, {int? rangeStart}) async {
    final request = await _client.getUrl(url);
    if (rangeStart != null) {
      request.headers.set(HttpHeaders.rangeHeader, 'bytes=$rangeStart-');
    }
    final response = await request.close();
    return DartPackResponse(request, response);
  }
}
