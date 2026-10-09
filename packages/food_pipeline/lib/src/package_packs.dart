import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

/// What the app tells the user each pack is.
const _titles = {
  'generic': 'Common foods',
  'barcode_us': 'Barcode foods, United States',
};

/// Prepares built packs for publishing (MM-56): gzip-compresses each
/// `*.pack` in [packs] into [out], and writes `manifest.json` listing each
/// with its size and SHA-256, served from [baseUrl].
///
/// Publishing is a separate, deliberate step: nothing is uploaded here. Do not
/// publish before the licensing has been reviewed (MM-57).
void packagePacks({
  required Directory packs,
  required Directory out,
  required Uri baseUrl,
}) {
  if (baseUrl.scheme != 'https') {
    throw ArgumentError('The base URL must be https: $baseUrl');
  }
  out.createSync(recursive: true);
  final entries = <Map<String, Object?>>[];
  final files =
      packs
          .listSync()
          .whereType<File>()
          .where((f) => f.path.endsWith('.pack'))
          .toList()
        ..sort((a, b) => a.path.compareTo(b.path));
  for (final file in files) {
    final pack = SqliteFoodPack.open(file.path);
    final header = pack.header;
    pack.close();
    final name = '${header.packId}-${header.builtOn}.pack.gz';
    // Fixed level and no timestamp in the stream, so the same pack gives the
    // same bytes and the same checksum.
    final compressed = GZipCodec(level: 9).encode(file.readAsBytesSync());
    File('${out.path}/$name').writeAsBytesSync(compressed);
    entries.add({
      'id': header.packId,
      'title': _titles[header.packId] ?? header.packId,
      'version': header.builtOn,
      'formatVersion': header.formatVersion,
      'url': baseUrl.resolve(name).toString(),
      'bytes': compressed.length,
      'sha256': sha256.convert(compressed).toString(),
      'gzip': true,
    });
  }
  File('${out.path}/manifest.json').writeAsStringSync(
    const JsonEncoder.withIndent('  ').convert({'packs': entries}),
  );
}
