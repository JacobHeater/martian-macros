import 'dart:convert';
import 'dart:io';

import '../toolchain.dart';
import 'fetch_food_sources.dart';

/// `mm food fetch | build` (MM-52).
///
///   mm food fetch [--cache DIR]      download the sources (reused if present)
///   mm food build [--cache DIR] [--out DIR] [--prefer off|usda_branded]
///                                     extract with DuckDB, then build the packs
///
/// The cache defaults to `.food_cache/` and the output to `.food_cache/packs/`;
/// neither is committed. `build` needs the DuckDB command-line tool on PATH.
Future<int> runFood(Toolchain tc, List<String> args) async {
  String? option(String name) {
    final i = args.indexOf(name);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
  }

  final cache = Directory(
    option('--cache') ?? '${tc.repoRoot.path}/.food_cache',
  );
  switch (args.firstOrNull) {
    case 'fetch':
      return fetchFoodSources(cache);
    case 'build':
      return _build(
        tc,
        cache,
        Directory(option('--out') ?? '${cache.path}/packs'),
        option('--prefer') ?? 'off',
      );
  }
  stderr.writeln('Usage: mm food <fetch|build> [--cache DIR] [--out DIR]');
  return 64;
}

Future<int> _build(
  Toolchain tc,
  Directory cache,
  Directory out,
  String prefer,
) async {
  final provenance = File('${cache.path}/provenance.json');
  if (!provenance.existsSync()) {
    stderr.writeln('No sources in ${cache.path}. Run "mm food fetch" first.');
    return 66;
  }
  try {
    await Process.run('duckdb', ['--version']);
  } on ProcessException {
    stderr.writeln(
      'The DuckDB command-line tool ("duckdb") is not on PATH. '
      'Install it from https://duckdb.org/install and run again.',
    );
    return 69;
  }
  final extract = Directory('${cache.path}/extract')
    ..createSync(recursive: true);
  String path(Directory d) => d.absolute.path.replaceAll(r'\', '/');
  final sql = File('${tc.repoRoot.path}/packages/food_pipeline/sql/extract.sql')
      .readAsStringSync()
      .replaceAll('{{cache}}', path(cache))
      .replaceAll('{{out}}', path(extract));

  stdout.writeln('extracting with DuckDB');
  final duckdb = await Process.start('duckdb', []);
  duckdb.stdin.write(sql);
  await duckdb.stdin.close();
  duckdb.stdout.transform(utf8.decoder).listen(stdout.write);
  duckdb.stderr.transform(utf8.decoder).listen(stderr.write);
  final extractCode = await duckdb.exitCode;
  if (extractCode != 0) return extractCode;

  return tc.dart([
    'run',
    'bin/build_packs.dart',
    '--extract',
    path(extract),
    '--provenance',
    '${path(cache)}/provenance.json',
    '--out',
    path(out),
    '--prefer',
    prefer,
  ], inDir: 'packages/food_pipeline');
}
