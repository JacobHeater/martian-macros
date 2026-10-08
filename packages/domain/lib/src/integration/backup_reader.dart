import 'dart:typed_data';

import 'outcome.dart';

/// Reads backup blobs from wherever they are stored.
abstract interface class BackupReader {
  /// The names of every stored blob, sorted.
  Future<Outcome<List<String>>> list();

  /// The blob named [name], or [NotFound].
  Future<Outcome<Uint8List>> get(String name);
}
