import 'dart:typed_data';

import 'outcome.dart';

/// Writes backup blobs to wherever they are stored.
abstract interface class BackupWriter {
  /// Stores [bytes] under [name], replacing any blob with that name.
  Future<Outcome<void>> put(String name, Uint8List bytes);

  /// Removes the blob named [name]; removing a missing one succeeds.
  Future<Outcome<void>> delete(String name);
}
