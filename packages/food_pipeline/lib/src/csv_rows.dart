import 'dart:convert';

/// Reads CSV (RFC 4180: quoted fields, doubled quotes, line breaks inside
/// quotes) from a stream of text, one row at a time, without holding the file
/// in memory.
Stream<List<String>> csvRows(Stream<String> chunks) async* {
  var row = <String>[];
  final field = StringBuffer();
  var inQuotes = false;
  var sawQuoteInside = false; // a `"` just ended a quoted run or is doubled
  var started = false; // anything seen for the current row

  await for (final chunk in chunks) {
    for (var i = 0; i < chunk.length; i++) {
      final c = chunk[i];
      if (inQuotes) {
        if (sawQuoteInside) {
          sawQuoteInside = false;
          if (c == '"') {
            field.write('"');
            continue;
          }
          inQuotes = false; // the quote closed the run; handle [c] below
        } else if (c == '"') {
          sawQuoteInside = true;
          continue;
        } else {
          field.write(c);
          continue;
        }
      }
      if (c == '"' && field.isEmpty) {
        inQuotes = true;
        started = true;
      } else if (c == ',') {
        row.add(field.toString());
        field.clear();
        started = true;
      } else if (c == '\n' || c == '\r') {
        if (c == '\r' && i + 1 < chunk.length && chunk[i + 1] == '\n') i++;
        if (started || field.isNotEmpty) {
          row.add(field.toString());
          yield row;
        }
        row = <String>[];
        field.clear();
        started = false;
      } else {
        field.write(c);
        started = true;
      }
    }
  }
  if (started || field.isNotEmpty) {
    row.add(field.toString());
    yield row;
  }
}

/// [csvRows] over a UTF-8 byte stream.
Stream<List<String>> csvRowsFromBytes(Stream<List<int>> bytes) =>
    csvRows(bytes.transform(utf8.decoder));
