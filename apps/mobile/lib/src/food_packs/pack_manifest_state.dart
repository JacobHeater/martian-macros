import 'package:mm_food_catalog/mm_food_catalog.dart';

/// The result of asking the host which packs exist.
final class PackManifestState {
  const PackManifestState.idle()
    : checking = false,
      manifest = null,
      message = null;
  const PackManifestState.checking()
    : checking = true,
      manifest = null,
      message = null;
  const PackManifestState.loaded(PackManifest this.manifest)
    : checking = false,
      message = null;
  const PackManifestState.failed(String this.message)
    : checking = false,
      manifest = null;

  final bool checking;
  final PackManifest? manifest;

  /// Why the host could not be read, in a sentence.
  final String? message;
}
