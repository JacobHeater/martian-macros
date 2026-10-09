import 'dart:io';

import 'package:mm_food_pipeline/mm_food_pipeline.dart';

/// `dart run bin/build_packs.dart --extract DIR --provenance FILE --out DIR
/// [--prefer recent|off|usda_branded]`: the second half of `mm food build`, after the
/// SQL extract has written the candidates file.
Future<void> main(List<String> args) async {
  String? option(String name) {
    final i = args.indexOf(name);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
  }

  final extract = option('--extract');
  final provenance = option('--provenance');
  final out = option('--out');
  if (extract == null || provenance == null || out == null) {
    stderr.writeln(
      'Usage: build_packs --extract DIR --provenance FILE --out DIR '
      '[--prefer recent|off|usda_branded]',
    );
    exitCode = 64;
    return;
  }
  final result = await PackBuilder(
    policy: switch (option('--prefer') ?? 'recent') {
      'recent' => const MostRecentPolicy(tieBreak: 'off'),
      final source => PreferredSourcePolicy(source),
    },
  ).build(readExtract(Directory(extract)));
  writePacks(result, BuildProvenance.read(File(provenance)), Directory(out));
  stdout.write(result.report.format());
  if (!result.report.reconciles) exitCode = 1;
}
