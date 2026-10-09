import 'dart:io';

import 'package:mm_food_pipeline/mm_food_pipeline.dart';

/// `dart run bin/package_packs.dart --packs DIR --out DIR --base-url HTTPS_URL`:
/// the step after a build, preparing files to publish. Uploads nothing.
void main(List<String> args) {
  String? option(String name) {
    final i = args.indexOf(name);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
  }

  final packs = option('--packs');
  final out = option('--out');
  final base = option('--base-url');
  if (packs == null || out == null || base == null) {
    stderr.writeln('Usage: package_packs --packs DIR --out DIR --base-url URL');
    exitCode = 64;
    return;
  }
  packagePacks(
    packs: Directory(packs),
    out: Directory(out),
    baseUrl: Uri.parse(base.endsWith('/') ? base : '$base/'),
  );
  stdout.writeln('Wrote $out. Review the licensing (MM-57) before publishing.');
}
