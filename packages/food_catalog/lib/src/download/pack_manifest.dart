import 'dart:convert';

import 'pack_listing.dart';

/// The small file that lists the packs available to download.
///
/// ```json
/// {"packs": [{"id": "barcode_us", "title": "...", "version": "2026-10-09",
///   "formatVersion": 1, "url": "https://...", "bytes": 48000000,
///   "sha256": "...", "gzip": true}]}
/// ```
final class PackManifest {
  const PackManifest(this.packs);

  /// Throws [FormatException] for a manifest that is not well formed, so a
  /// broken file is reported and never half-read.
  factory PackManifest.parse(String json) {
    final decoded = jsonDecode(json);
    if (decoded is! Map<String, Object?> ||
        decoded['packs'] is! List<Object?>) {
      throw const FormatException('The manifest has no "packs" list.');
    }
    return PackManifest([
      for (final item in decoded['packs']! as List<Object?>) _listing(item),
    ]);
  }

  final List<PackListing> packs;

  PackListing? pack(String id) {
    for (final p in packs) {
      if (p.id == id) return p;
    }
    return null;
  }

  static PackListing _listing(Object? item) {
    if (item is! Map<String, Object?>) {
      throw const FormatException('A pack entry is not an object.');
    }
    T field<T>(String key) {
      final v = item[key];
      if (v is! T) throw FormatException('A pack entry needs "$key".');
      return v;
    }

    final url = Uri.parse(field<String>('url'));
    if (!url.hasScheme || url.scheme != 'https') {
      throw FormatException('Pack URLs must be https: $url');
    }
    final sha = field<String>('sha256').toLowerCase();
    if (!RegExp(r'^[0-9a-f]{64}$').hasMatch(sha)) {
      throw const FormatException('A pack entry needs a 64-digit sha256.');
    }
    return PackListing(
      id: field<String>('id'),
      title: field<String>('title'),
      version: field<String>('version'),
      formatVersion: field<int>('formatVersion'),
      url: url,
      downloadBytes: field<int>('bytes'),
      sha256: sha,
      gzip: item['gzip'] as bool? ?? true,
    );
  }
}
